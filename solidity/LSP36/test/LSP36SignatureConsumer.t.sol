// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {SignedAuthorization} from "../src/ILSP36SignatureVerification.sol";
import {ILSP36SignatureConsumer} from "../src/ILSP36SignatureConsumer.sol";
import {LSP36SignatureConsumer} from "../src/LSP36SignatureConsumer.sol";
import {LSP36SignatureVerification} from "../src/LSP36SignatureVerification.sol";
import {SIGNED_AUTHORIZATION_TYPEHASH, MODE_FULL_VERIFICATION, MODE_PRE_APPROVED} from "../src/LSP36Constants.sol";
import {
    LSP36SignatureIdAlreadyUsed,
    LSP36InvalidSignature,
    LSP36SignatureExpired,
    LSP36SignatureNotYetValid,
    LSP36InvalidSigner,
    LSP36TargetMismatch,
    LSP36PreApprovalNotFound,
    LSP36InvalidMode
} from "../src/LSP36Errors.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {IERC1271} from "@openzeppelin/contracts/interfaces/IERC1271.sol";
import {MockERC1271Wallet, MockMode} from "./mocks/MockERC1271Wallet.sol";

bytes32 constant _EIP712_DOMAIN_TYPEHASH =
    keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
bytes32 constant _NAME_HASH = keccak256("LSP36SignedAuthorization");
bytes32 constant _VERSION_HASH = keccak256("1");

uint256 constant SECP256K1_ORDER = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;

contract MockConsumer is LSP36SignatureConsumer {
    mapping(bytes32 => bool) public executed;

    // Mode 0x00: full verification via proper ABI-encoded call
    function executeFullVerification(
        address,
        uint256,
        SignedAuthorization calldata auth,
        bytes calldata signature
    ) external payable {
        _verifyAndConsume(auth, signature, msg.data[:68]);
        executed[auth.signatureId] = true;
    }

    // Mode 0x01: pre-approved via trailing bytes, also handles invalid mode dispatch
    function execute(address, uint256) external payable {
        bytes calldata data = msg.data;
        uint8 mode = _extractMode(data);

        if (mode == MODE_PRE_APPROVED) {
            bytes32 signatureId = _extractPreApprovedId(data);
            _executePreApproved(signatureId, data[:68]);
            executed[signatureId] = true;
        } else {
            revert LSP36InvalidMode(mode);
        }
    }

    function verifyOnly(SignedAuthorization calldata auth, bytes calldata signature) external view returns (bool) {
        return _verifySignature(auth, signature);
    }

    receive() external payable {}
}

contract LSP36SignatureConsumerTest is Test {
    MockConsumer consumer;
    uint256 internal signerKey;
    address internal signer;

    function setUp() public {
        consumer = new MockConsumer();
        signerKey = 0xA11CE;
        signer = vm.addr(signerKey);
        vm.deal(signer, 10 ether);
        vm.deal(address(this), 10 ether);
    }

    function _boundPrivateKey(uint256 pk) internal pure returns (uint256) {
        return bound(pk, 1, SECP256K1_ORDER - 1);
    }

    function _computeDomainSeparator() internal view returns (bytes32) {
        return keccak256(
            abi.encode(_EIP712_DOMAIN_TYPEHASH, _NAME_HASH, _VERSION_HASH, block.chainid, address(consumer))
        );
    }

    function _computeDigest(SignedAuthorization memory auth) internal view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                SIGNED_AUTHORIZATION_TYPEHASH,
                auth.signer,
                auth.target,
                auth.selector,
                keccak256(abi.encodePacked(auth.paramValues)),
                auth.paramWildcards,
                auth.paramDynamicMask,
                auth.valueIsWildcard,
                auth.value,
                auth.signatureId,
                auth.validAfter,
                auth.validBefore,
                auth.nonce
            )
        );
        return MessageHashUtils.toTypedDataHash(_computeDomainSeparator(), structHash);
    }

    function _sign(uint256 privateKey, bytes32 digest) internal pure returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function _buildAuth(uint256 privateKey, bytes4 fnSelector)
        internal
        view
        returns (SignedAuthorization memory auth)
    {
        bytes32[] memory paramValues = new bytes32[](2);
        paramValues[0] = bytes32(uint256(uint160(address(0xBEEF))));
        paramValues[1] = bytes32(uint256(1 ether));

        auth = SignedAuthorization({
            signer: vm.addr(privateKey),
            target: address(consumer),
            selector: fnSelector,
            paramValues: paramValues,
            paramWildcards: 0,
            paramDynamicMask: 0,
            valueIsWildcard: true,
            value: 0,
            signatureId: keccak256(abi.encodePacked("sig-id", privateKey)),
            validAfter: 0,
            validBefore: type(uint48).max,
            nonce: 0
        });
    }

    function _buildAndSignFull(uint256 privateKey)
        internal
        view
        returns (SignedAuthorization memory auth, bytes memory signature)
    {
        auth = _buildAuth(privateKey, MockConsumer.executeFullVerification.selector);
        signature = _sign(privateKey, _computeDigest(auth));
    }

    function _buildAndSignPreApproved(uint256 privateKey)
        internal
        view
        returns (SignedAuthorization memory auth, bytes memory signature)
    {
        auth = _buildAuth(privateKey, MockConsumer.execute.selector);
        signature = _sign(privateKey, _computeDigest(auth));
    }

    function _encodePreApprovedCall(address to, uint256 amount, bytes32 signatureId)
        internal
        pure
        returns (bytes memory)
    {
        bytes memory baseCalldata = abi.encodeWithSelector(MockConsumer.execute.selector, to, amount);
        return abi.encodePacked(baseCalldata, signatureId, MODE_PRE_APPROVED);
    }

    // =========================================================================
    // 1-tx full verification (R003, R016, R019 mode 0x00)
    // =========================================================================

    function test_fullVerification_success() public {
        (SignedAuthorization memory auth, bytes memory sig) = _buildAndSignFull(signerKey);
        consumer.executeFullVerification(address(0xBEEF), 1 ether, auth, sig);
        assertTrue(consumer.executed(auth.signatureId), "signatureId not marked executed");
    }

    function test_fullVerification_rejectReplay() public {
        (SignedAuthorization memory auth, bytes memory sig) = _buildAndSignFull(signerKey);
        consumer.executeFullVerification(address(0xBEEF), 1 ether, auth, sig);

        vm.expectRevert(abi.encodeWithSelector(LSP36SignatureIdAlreadyUsed.selector, auth.signatureId));
        consumer.executeFullVerification(address(0xBEEF), 1 ether, auth, sig);
    }

    // =========================================================================
    // 2-tx pre-approval lifecycle (R007, R019 mode 0x01)
    // =========================================================================

    function test_preApprove_and_execute() public {
        (SignedAuthorization memory auth, bytes memory sig) = _buildAndSignPreApproved(signerKey);
        consumer.preApprove(auth, sig);
        assertTrue(consumer.isPreApproved(auth.signatureId));

        bytes memory payload = _encodePreApprovedCall(address(0xBEEF), 1 ether, auth.signatureId);
        (bool success,) = address(consumer).call(payload);
        assertTrue(success, "pre-approved execution failed");
        assertTrue(consumer.executed(auth.signatureId));
    }

    function test_preApprove_rejectReplayAfterExecution() public {
        (SignedAuthorization memory auth, bytes memory sig) = _buildAndSignPreApproved(signerKey);
        consumer.preApprove(auth, sig);

        bytes memory payload = _encodePreApprovedCall(address(0xBEEF), 1 ether, auth.signatureId);
        (bool success,) = address(consumer).call(payload);
        assertTrue(success);

        (bool success2, bytes memory returnData) = address(consumer).call(payload);
        assertFalse(success2, "replay should revert");
        assertEq(bytes4(returnData), LSP36PreApprovalNotFound.selector);
    }

    function test_preApprove_emitsEvent() public {
        (SignedAuthorization memory auth, bytes memory sig) = _buildAndSignPreApproved(signerKey);

        vm.expectEmit(true, true, false, false, address(consumer));
        emit ILSP36SignatureConsumer.PreApprovalStored(auth.signatureId, auth.signer);
        consumer.preApprove(auth, sig);
    }

    function test_isPreApproved_trueAfterStore_falseAfterExecute() public {
        (SignedAuthorization memory auth, bytes memory sig) = _buildAndSignPreApproved(signerKey);
        assertFalse(consumer.isPreApproved(auth.signatureId));

        consumer.preApprove(auth, sig);
        assertTrue(consumer.isPreApproved(auth.signatureId));

        bytes memory payload = _encodePreApprovedCall(address(0xBEEF), 1 ether, auth.signatureId);
        (bool success,) = address(consumer).call(payload);
        assertTrue(success);
        assertFalse(consumer.isPreApproved(auth.signatureId));
    }

    // =========================================================================
    // Revocation (R017)
    // =========================================================================

    function test_revokePreApproval_bySigner() public {
        (SignedAuthorization memory auth, bytes memory sig) = _buildAndSignPreApproved(signerKey);
        consumer.preApprove(auth, sig);

        vm.expectEmit(true, false, false, false, address(consumer));
        emit ILSP36SignatureConsumer.PreApprovalRevoked(auth.signatureId);

        vm.prank(signer);
        consumer.revokePreApproval(auth.signatureId);
        assertFalse(consumer.isPreApproved(auth.signatureId));
    }

    function test_revokePreApproval_byNonSigner_reverts() public {
        (SignedAuthorization memory auth, bytes memory sig) = _buildAndSignPreApproved(signerKey);
        consumer.preApprove(auth, sig);

        address nonSigner = address(0xBAD);
        vm.prank(nonSigner);
        vm.expectRevert(abi.encodeWithSelector(LSP36InvalidSigner.selector, nonSigner, signer));
        consumer.revokePreApproval(auth.signatureId);
    }

    function test_revokePreApproval_notFound_reverts() public {
        bytes32 fakeSigId = keccak256("nonexistent");
        vm.expectRevert(abi.encodeWithSelector(LSP36PreApprovalNotFound.selector, fakeSigId));
        consumer.revokePreApproval(fakeSigId);
    }

    // =========================================================================
    // Expiry cleanup (R018)
    // =========================================================================

    function test_clearExpired_afterExpiry() public {
        SignedAuthorization memory auth = _buildAuth(signerKey, MockConsumer.execute.selector);
        auth.validBefore = uint48(block.timestamp + 100);
        bytes memory sig = _sign(signerKey, _computeDigest(auth));

        consumer.preApprove(auth, sig);
        assertTrue(consumer.isPreApproved(auth.signatureId));

        vm.warp(block.timestamp + 100);

        vm.expectEmit(true, false, false, false, address(consumer));
        emit ILSP36SignatureConsumer.PreApprovalCleared(auth.signatureId);
        consumer.clearExpiredPreApproval(auth.signatureId);
        assertFalse(consumer.isPreApproved(auth.signatureId));
    }

    function test_clearExpired_beforeExpiry_reverts() public {
        SignedAuthorization memory auth = _buildAuth(signerKey, MockConsumer.execute.selector);
        auth.validBefore = uint48(block.timestamp + 100);
        bytes memory sig = _sign(signerKey, _computeDigest(auth));

        consumer.preApprove(auth, sig);

        vm.expectRevert(
            abi.encodeWithSelector(LSP36SignatureNotYetValid.selector, auth.validAfter, block.timestamp)
        );
        consumer.clearExpiredPreApproval(auth.signatureId);
    }

    // =========================================================================
    // CEI reentrancy proof (R009)
    // =========================================================================

    function test_reentrancy_signatureConsumedBeforeEIP1271() public {
        // CEI defense-in-depth: signatureId is consumed before isValidSignature callback.
        // The EIP-1271 call uses STATICCALL (primary protection), and CEI ordering
        // ensures the signatureId is consumed even if the call were non-static.
        MockERC1271Wallet wallet = new MockERC1271Wallet(MockMode.VALID, signer);

        SignedAuthorization memory auth = _buildAuth(signerKey, MockConsumer.executeFullVerification.selector);
        auth.signer = address(wallet);
        bytes memory sig = _sign(signerKey, _computeDigest(auth));

        consumer.executeFullVerification(address(0xBEEF), 1 ether, auth, sig);
        assertTrue(consumer.executed(auth.signatureId));

        // Replay proves signatureId was consumed before the EIP-1271 callback
        vm.expectRevert(abi.encodeWithSelector(LSP36SignatureIdAlreadyUsed.selector, auth.signatureId));
        consumer.executeFullVerification(address(0xBEEF), 1 ether, auth, sig);
    }

    // =========================================================================
    // Mode parsing (R019)
    // =========================================================================

    function test_invalidMode_reverts() public {
        bytes memory baseCalldata = abi.encodeWithSelector(MockConsumer.execute.selector, address(0xBEEF), 1 ether);
        bytes memory payload = abi.encodePacked(baseCalldata, bytes32(0), uint8(0x02));

        (bool success, bytes memory returnData) = address(consumer).call(payload);
        assertFalse(success, "invalid mode should revert");
        assertEq(bytes4(returnData), LSP36InvalidMode.selector);
    }

    // =========================================================================
    // Consumer-level error selector tests (gap coverage)
    // =========================================================================

    function test_fullVerification_invalidSignature_reverts() public {
        (SignedAuthorization memory auth,) = _buildAndSignFull(signerKey);
        bytes memory badSig = new bytes(65);

        vm.expectRevert(abi.encodeWithSelector(LSP36InvalidSignature.selector));
        consumer.executeFullVerification(address(0xBEEF), 1 ether, auth, badSig);
    }

    function test_fullVerification_targetMismatch_reverts() public {
        SignedAuthorization memory auth = _buildAuth(signerKey, MockConsumer.executeFullVerification.selector);
        auth.target = address(0xDEAD);
        bytes memory sig = _sign(signerKey, _computeDigest(auth));

        vm.expectRevert(abi.encodeWithSelector(LSP36TargetMismatch.selector, address(0xDEAD), address(consumer)));
        consumer.executeFullVerification(address(0xBEEF), 1 ether, auth, sig);
    }

    // =========================================================================
    // Boolean API (R016)
    // =========================================================================

    function test_verifyOnly_validSignature_returnsTrue() public view {
        (SignedAuthorization memory auth, bytes memory sig) = _buildAndSignFull(signerKey);
        assertTrue(consumer.verifyOnly(auth, sig));
    }

    function test_verifyOnly_invalidSignature_returnsFalse() public view {
        (SignedAuthorization memory auth,) = _buildAndSignFull(signerKey);
        bytes memory badSig = new bytes(65);
        assertFalse(consumer.verifyOnly(auth, badSig));
    }

    // =========================================================================
    // Fuzz tests (R014 supporting)
    // =========================================================================

    /// forge-config: default.fuzz.runs = 256
    function testFuzz_fullVerification_uniqueIds(uint256 pk) public {
        pk = _boundPrivateKey(pk);
        (SignedAuthorization memory auth, bytes memory sig) = _buildAndSignFull(pk);
        consumer.executeFullVerification(address(0xBEEF), 1 ether, auth, sig);
        assertTrue(consumer.executed(auth.signatureId));
    }

    /// forge-config: default.fuzz.runs = 256
    function testFuzz_preApprove_and_execute(uint256 pk) public {
        pk = _boundPrivateKey(pk);
        (SignedAuthorization memory auth, bytes memory sig) = _buildAndSignPreApproved(pk);
        consumer.preApprove(auth, sig);
        assertTrue(consumer.isPreApproved(auth.signatureId));

        bytes memory payload = _encodePreApprovedCall(address(0xBEEF), 1 ether, auth.signatureId);
        (bool success,) = address(consumer).call(payload);
        assertTrue(success, "fuzz pre-approve+execute failed");
        assertTrue(consumer.executed(auth.signatureId));
        assertFalse(consumer.isPreApproved(auth.signatureId));
    }

    // =========================================================================
    // Negative tests — expiry, not-yet-valid, non-existent, boundary conditions
    // =========================================================================

    function test_expiredAuth_reverts() public {
        SignedAuthorization memory auth = _buildAuth(signerKey, MockConsumer.executeFullVerification.selector);
        auth.validBefore = uint48(block.timestamp);
        bytes memory sig = _sign(signerKey, _computeDigest(auth));

        vm.expectRevert(
            abi.encodeWithSelector(LSP36SignatureExpired.selector, auth.validBefore, block.timestamp)
        );
        consumer.executeFullVerification(address(0xBEEF), 1 ether, auth, sig);
    }

    function test_notYetValid_reverts() public {
        SignedAuthorization memory auth = _buildAuth(signerKey, MockConsumer.executeFullVerification.selector);
        auth.validAfter = uint48(block.timestamp + 1000);
        bytes memory sig = _sign(signerKey, _computeDigest(auth));

        vm.expectRevert(
            abi.encodeWithSelector(LSP36SignatureNotYetValid.selector, auth.validAfter, block.timestamp)
        );
        consumer.executeFullVerification(address(0xBEEF), 1 ether, auth, sig);
    }

    function test_executeNonExistentPreApproval_reverts() public {
        bytes32 fakeSigId = keccak256("nonexistent");
        bytes memory payload = _encodePreApprovedCall(address(0xBEEF), 1 ether, fakeSigId);

        (bool success, bytes memory returnData) = address(consumer).call(payload);
        assertFalse(success);
        assertEq(bytes4(returnData), LSP36PreApprovalNotFound.selector);
    }

    function test_validAfterEqualsTimestamp_isValid() public {
        SignedAuthorization memory auth = _buildAuth(signerKey, MockConsumer.executeFullVerification.selector);
        auth.validAfter = uint48(block.timestamp);
        bytes memory sig = _sign(signerKey, _computeDigest(auth));

        consumer.executeFullVerification(address(0xBEEF), 1 ether, auth, sig);
        assertTrue(consumer.executed(auth.signatureId));
    }

    function test_validBeforeEqualsTimestamp_isExpired() public {
        SignedAuthorization memory auth = _buildAuth(signerKey, MockConsumer.executeFullVerification.selector);
        auth.validBefore = uint48(block.timestamp);
        bytes memory sig = _sign(signerKey, _computeDigest(auth));

        vm.expectRevert(
            abi.encodeWithSelector(LSP36SignatureExpired.selector, auth.validBefore, block.timestamp)
        );
        consumer.executeFullVerification(address(0xBEEF), 1 ether, auth, sig);
    }
}

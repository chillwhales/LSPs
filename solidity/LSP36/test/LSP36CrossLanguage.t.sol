// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {SignedAuthorization} from "../src/ILSP36SignatureVerification.sol";
import {LSP36SignatureVerification} from "../src/LSP36SignatureVerification.sol";

bytes32 constant _EIP712_DOMAIN_TYPEHASH =
    keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
bytes32 constant _NAME_HASH = keccak256("LSP36SignedAuthorization");
bytes32 constant _VERSION_HASH = keccak256("1");

contract LSP36Harness_CrossLang {
    function computeStructHash(SignedAuthorization calldata auth) external pure returns (bytes32) {
        return LSP36SignatureVerification.computeStructHash(auth);
    }

    function computeDomainSeparator(address verifyingContract) external view returns (bytes32) {
        return LSP36SignatureVerification.computeDomainSeparator(verifyingContract);
    }

    function verifySignature(
        SignedAuthorization calldata auth,
        bytes calldata signature,
        address verifyingContract
    ) external view returns (bool) {
        return LSP36SignatureVerification.verifySignature(auth, signature, verifyingContract);
    }
}

contract LSP36CrossLanguageTest is Test {
    LSP36Harness_CrossLang harness;

    SignedAuthorization fixtureAuth;
    bytes fixtureSignature;
    bytes32 fixtureDigest;
    address fixtureVerifyingContract;

    function setUp() public {
        harness = new LSP36Harness_CrossLang();
        _loadFixture();
    }

    function _loadFixture() internal {
        string memory json = vm.readFile("test/fixtures/ts-signed-auth.json");

        fixtureAuth.signer = vm.parseJsonAddress(json, ".auth.signer");
        fixtureAuth.target = vm.parseJsonAddress(json, ".auth.target");
        fixtureAuth.selector = bytes4(vm.parseJsonBytes(json, ".auth.selector"));
        fixtureAuth.paramValues = vm.parseJsonBytes32Array(json, ".auth.paramValues");
        fixtureAuth.paramWildcards = vm.parseJsonUint(json, ".auth.paramWildcards");
        fixtureAuth.paramDynamicMask = vm.parseJsonUint(json, ".auth.paramDynamicMask");
        fixtureAuth.valueIsWildcard = vm.parseJsonBool(json, ".auth.valueIsWildcard");
        fixtureAuth.value = vm.parseJsonUint(json, ".auth.value");
        fixtureAuth.signatureId = vm.parseJsonBytes32(json, ".auth.signatureId");
        fixtureAuth.validAfter = uint48(vm.parseJsonUint(json, ".auth.validAfter"));
        fixtureAuth.validBefore = uint48(vm.parseJsonUint(json, ".auth.validBefore"));
        fixtureAuth.nonce = vm.parseJsonUint(json, ".auth.nonce");

        fixtureSignature = vm.parseJsonBytes(json, ".signature");
        fixtureDigest = vm.parseJsonBytes32(json, ".digest");
        fixtureVerifyingContract = vm.parseJsonAddress(json, ".verifyingContract");
    }

    function test_crossLanguage_signatureVerifies() public view {
        bool valid = harness.verifySignature(fixtureAuth, fixtureSignature, fixtureVerifyingContract);
        assertTrue(valid, "TS-signed authorization must verify in Solidity");
    }

    function test_crossLanguage_structHashMatches() public view {
        bytes32 structHash = harness.computeStructHash(fixtureAuth);
        bytes32 domainSep = harness.computeDomainSeparator(fixtureVerifyingContract);
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSep, structHash));
        assertEq(digest, fixtureDigest, "EIP-712 digest must match between TS and Solidity");
    }

    function test_crossLanguage_domainSeparatorMatches() public view {
        bytes32 domainSep = harness.computeDomainSeparator(fixtureVerifyingContract);
        bytes32 expected = keccak256(
            abi.encode(_EIP712_DOMAIN_TYPEHASH, _NAME_HASH, _VERSION_HASH, block.chainid, fixtureVerifyingContract)
        );
        assertEq(domainSep, expected, "Domain separator must match known EIP-712 domain");
    }

    function test_crossLanguage_gasUnder50k() public view {
        uint256 gasBefore = gasleft();
        harness.verifySignature(fixtureAuth, fixtureSignature, fixtureVerifyingContract);
        uint256 gasUsed = gasBefore - gasleft();
        assertLt(gasUsed, 50_000, "verifySignature gas must be under 50k");
    }
}

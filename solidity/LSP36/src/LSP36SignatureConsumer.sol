// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

import {SignedAuthorization} from "./ILSP36SignatureVerification.sol";
import {ILSP36SignatureConsumer} from "./ILSP36SignatureConsumer.sol";
import {LSP36SignatureVerification} from "./LSP36SignatureVerification.sol";
import {
    LSP36SignatureIdAlreadyUsed,
    LSP36InvalidSignature,
    LSP36SignatureExpired,
    LSP36SignatureNotYetValid,
    LSP36InvalidSigner,
    LSP36TargetMismatch,
    LSP36PreApprovalNotFound
} from "./LSP36Errors.sol";

abstract contract LSP36SignatureConsumer is ILSP36SignatureConsumer {
    using LSP36SignatureVerification for SignedAuthorization;

    struct PreApproval {
        address signer;
        uint48 validAfter;
        uint48 validBefore;
        bytes4 selector;
        bytes32[] paramValues;
        uint256 paramWildcards;
        uint256 paramDynamicMask;
        bool valueIsWildcard;
        uint256 value;
    }

    mapping(bytes32 => bool) private _consumedSignatureIds;
    mapping(bytes32 => PreApproval) private _preApprovals;

    // -------------------------------------------------------------------------
    // Trailing bytes extraction
    // -------------------------------------------------------------------------

    function _extractMode(bytes calldata msgData) internal pure returns (uint8) {
        return uint8(msgData[msgData.length - 1]);
    }

    function _extractFullVerification(bytes calldata msgData)
        internal
        pure
        returns (bytes calldata signature, bytes calldata authData)
    {
        // Layout: [originalCalldata | authData | signature(65) | mode(1)]
        // Last byte = mode, preceding 65 bytes = signature, rest = ABI-encoded SignedAuthorization
        uint256 end = msgData.length - 1; // strip mode byte
        uint256 sigStart = end - 65;
        signature = msgData[sigStart:end];
        authData = msgData[sigStart:sigStart]; // placeholder — caller decodes auth from calldata directly
        // The actual auth is passed as a calldata parameter by the caller framework
    }

    function _extractPreApprovedId(bytes calldata msgData) internal pure returns (bytes32) {
        // Layout: [originalCalldata | signatureId(32) | mode(1)]
        uint256 end = msgData.length - 1;
        return bytes32(msgData[end - 32:end]);
    }

    // -------------------------------------------------------------------------
    // Full verification flow (mode 0x00) — CEI pattern per R009
    // -------------------------------------------------------------------------

    function _verifyAndConsume(
        SignedAuthorization calldata auth,
        bytes calldata signature,
        bytes calldata originalCalldata
    ) internal {
        if (!LSP36SignatureVerification.verifyTimeBounds(auth.validAfter, auth.validBefore)) {
            if (block.timestamp >= auth.validBefore) {
                revert LSP36SignatureExpired(auth.validBefore, block.timestamp);
            }
            revert LSP36SignatureNotYetValid(auth.validAfter, block.timestamp);
        }

        if (!LSP36SignatureVerification.verifyTarget(auth.target, address(this))) {
            revert LSP36TargetMismatch(auth.target, address(this));
        }

        if (_consumedSignatureIds[auth.signatureId]) {
            revert LSP36SignatureIdAlreadyUsed(auth.signatureId);
        }

        // EFFECTS before INTERACTIONS (R009): mark consumed before external call
        _consumedSignatureIds[auth.signatureId] = true;

        if (!LSP36SignatureVerification.verifySignature(auth, signature, address(this))) {
            revert LSP36InvalidSignature();
        }

        if (bytes4(originalCalldata[:4]) != auth.selector) {
            revert LSP36TargetMismatch(auth.target, address(this));
        }

        if (
            !LSP36SignatureVerification.verifyParams(
                auth.paramValues, auth.paramWildcards, auth.paramDynamicMask, originalCalldata
            )
        ) {
            revert LSP36InvalidSignature();
        }

        if (!LSP36SignatureVerification.verifyValue(auth.valueIsWildcard, auth.value, msg.value)) {
            revert LSP36InvalidSignature();
        }
    }

    // -------------------------------------------------------------------------
    // Pre-approved execution flow (mode 0x01)
    // -------------------------------------------------------------------------

    function _executePreApproved(bytes32 signatureId, bytes calldata originalCalldata) internal {
        PreApproval storage approval = _preApprovals[signatureId];

        if (approval.signer == address(0)) {
            revert LSP36PreApprovalNotFound(signatureId);
        }

        if (!LSP36SignatureVerification.verifyTimeBounds(approval.validAfter, approval.validBefore)) {
            if (block.timestamp >= approval.validBefore) {
                revert LSP36SignatureExpired(approval.validBefore, block.timestamp);
            }
            revert LSP36SignatureNotYetValid(approval.validAfter, block.timestamp);
        }

        if (_consumedSignatureIds[signatureId]) {
            revert LSP36SignatureIdAlreadyUsed(signatureId);
        }

        // EFFECTS before any further logic
        _consumedSignatureIds[signatureId] = true;

        if (bytes4(originalCalldata[:4]) != approval.selector) {
            revert LSP36TargetMismatch(address(this), address(this));
        }

        if (!_verifyParamsFromStorage(approval, originalCalldata)) {
            revert LSP36InvalidSignature();
        }

        if (!LSP36SignatureVerification.verifyValue(approval.valueIsWildcard, approval.value, msg.value)) {
            revert LSP36InvalidSignature();
        }

        delete _preApprovals[signatureId];
    }

    // Storage-to-memory bridge for param verification (library expects calldata arrays)
    function _verifyParamsFromStorage(PreApproval storage approval, bytes calldata actualCalldata)
        private
        view
        returns (bool)
    {
        bytes32[] memory paramValues = approval.paramValues;
        uint256 paramWildcards = approval.paramWildcards;
        uint256 paramDynamicMask = approval.paramDynamicMask;
        uint256 len = paramValues.length;

        for (uint256 i; i < len; ++i) {
            if ((paramWildcards >> i) & 1 == 1) continue;

            if ((paramDynamicMask >> i) & 1 == 1) {
                uint256 offsetPos = 4 + i * 32;
                if (offsetPos + 32 > actualCalldata.length) return false;

                uint256 offset = uint256(bytes32(actualCalldata[offsetPos:offsetPos + 32]));
                uint256 dataPos = 4 + offset;
                if (dataPos + 32 > actualCalldata.length) return false;

                uint256 dataLen = uint256(bytes32(actualCalldata[dataPos:dataPos + 32]));
                uint256 dataStart = dataPos + 32;
                if (dataStart + dataLen > actualCalldata.length) return false;

                bytes32 hashed = keccak256(actualCalldata[dataStart:dataStart + dataLen]);
                if (hashed != paramValues[i]) return false;
            } else {
                uint256 pos = 4 + i * 32;
                if (pos + 32 > actualCalldata.length) return false;

                if (bytes32(actualCalldata[pos:pos + 32]) != paramValues[i]) return false;
            }
        }
        return true;
    }

    // -------------------------------------------------------------------------
    // External API — ILSP36SignatureConsumer
    // -------------------------------------------------------------------------

    function preApprove(SignedAuthorization calldata auth, bytes calldata signature) external override {
        if (!LSP36SignatureVerification.verifyTimeBounds(auth.validAfter, auth.validBefore)) {
            if (block.timestamp >= auth.validBefore) {
                revert LSP36SignatureExpired(auth.validBefore, block.timestamp);
            }
            revert LSP36SignatureNotYetValid(auth.validAfter, block.timestamp);
        }

        if (!LSP36SignatureVerification.verifyTarget(auth.target, address(this))) {
            revert LSP36TargetMismatch(auth.target, address(this));
        }

        if (_consumedSignatureIds[auth.signatureId]) {
            revert LSP36SignatureIdAlreadyUsed(auth.signatureId);
        }

        if (!LSP36SignatureVerification.verifySignature(auth, signature, address(this))) {
            revert LSP36InvalidSignature();
        }

        PreApproval storage approval = _preApprovals[auth.signatureId];
        approval.signer = auth.signer;
        approval.validAfter = auth.validAfter;
        approval.validBefore = auth.validBefore;
        approval.selector = auth.selector;
        approval.paramValues = auth.paramValues;
        approval.paramWildcards = auth.paramWildcards;
        approval.paramDynamicMask = auth.paramDynamicMask;
        approval.valueIsWildcard = auth.valueIsWildcard;
        approval.value = auth.value;

        emit PreApprovalStored(auth.signatureId, auth.signer);
    }

    function revokePreApproval(bytes32 signatureId) external override {
        PreApproval storage approval = _preApprovals[signatureId];

        if (approval.signer == address(0)) {
            revert LSP36PreApprovalNotFound(signatureId);
        }

        if (approval.signer != msg.sender) {
            revert LSP36InvalidSigner(msg.sender, approval.signer);
        }

        delete _preApprovals[signatureId];
        emit PreApprovalRevoked(signatureId);
    }

    function clearExpiredPreApproval(bytes32 signatureId) external override {
        PreApproval storage approval = _preApprovals[signatureId];

        if (approval.signer == address(0)) {
            revert LSP36PreApprovalNotFound(signatureId);
        }

        if (block.timestamp < approval.validBefore) {
            revert LSP36SignatureNotYetValid(approval.validAfter, block.timestamp);
        }

        delete _preApprovals[signatureId];
        emit PreApprovalCleared(signatureId);
    }

    function isPreApproved(bytes32 signatureId) external view override returns (bool) {
        return _preApprovals[signatureId].signer != address(0);
    }

    // -------------------------------------------------------------------------
    // Boolean API surface (R016)
    // -------------------------------------------------------------------------

    function _verifySignature(SignedAuthorization calldata auth, bytes calldata signature)
        internal
        view
        returns (bool)
    {
        return LSP36SignatureVerification.verifySignature(auth, signature, address(this));
    }
}

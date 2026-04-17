// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

import {SignedAuthorization} from "./ILSP36SignatureVerification.sol";

interface ILSP36SignatureConsumer {
    event PreApprovalStored(bytes32 indexed signatureId, address indexed signer);
    event PreApprovalRevoked(bytes32 indexed signatureId);
    event PreApprovalCleared(bytes32 indexed signatureId);

    function preApprove(
        SignedAuthorization calldata auth,
        bytes calldata signature
    ) external;

    function revokePreApproval(bytes32 signatureId) external;

    function clearExpiredPreApproval(bytes32 signatureId) external;

    function isPreApproved(bytes32 signatureId) external view returns (bool);
}

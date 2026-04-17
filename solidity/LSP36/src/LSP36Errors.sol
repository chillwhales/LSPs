// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

error LSP36SignatureIdAlreadyUsed(bytes32 signatureId);
error LSP36InvalidSignature();
error LSP36SignatureExpired(uint48 validBefore, uint256 blockTimestamp);
error LSP36SignatureNotYetValid(uint48 validAfter, uint256 blockTimestamp);
error LSP36InvalidSigner(address recovered, address expected);
error LSP36TargetMismatch(address target, address actual);
error LSP36PreApprovalNotFound(bytes32 signatureId);
error LSP36InvalidMode(uint8 mode);

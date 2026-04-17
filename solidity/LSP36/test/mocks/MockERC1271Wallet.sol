// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

import {IERC1271} from "@openzeppelin/contracts/interfaces/IERC1271.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

enum MockMode {
    VALID,
    INVALID,
    REVERTING,
    GAS_BURNER
}

contract MockERC1271Wallet is IERC1271 {
    bytes4 private constant _EIP1271_MAGIC = 0x1626ba7e;

    MockMode public immutable mode;
    address public immutable expectedSigner;

    constructor(MockMode _mode, address _expectedSigner) {
        mode = _mode;
        expectedSigner = _expectedSigner;
    }

    function isValidSignature(bytes32 hash, bytes calldata signature) external view override returns (bytes4) {
        if (mode == MockMode.VALID) {
            address recovered = ECDSA.recover(hash, signature);
            if (recovered == expectedSigner) return _EIP1271_MAGIC;
            return bytes4(0xffffffff);
        } else if (mode == MockMode.INVALID) {
            return bytes4(0xffffffff);
        } else if (mode == MockMode.REVERTING) {
            revert("MockERC1271Wallet: forced revert");
        } else {
            // GAS_BURNER: consume >50k gas then return magic
            uint256 i;
            bytes32 sink;
            while (gasleft() > 1000) {
                sink = keccak256(abi.encode(sink, i));
                unchecked { ++i; }
            }
            return _EIP1271_MAGIC;
        }
    }
}

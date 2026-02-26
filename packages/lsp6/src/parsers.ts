/**
 * LSP6 Data Parsers
 *
 * Functions for parsing CompactBytesArray-encoded ERC725Y values
 * related to LSP6 Key Manager permissions.
 *
 * @see https://docs.lukso.tech/standards/universal-profile/lsp6-key-manager
 */

import ERC725 from "@erc725/erc725.js";
import LSP6Schemas from "@erc725/erc725.js/schemas/LSP6KeyManager.json";
import { type Address, getAddress, type Hex, isHex } from "viem";
import type { AllowedCall } from "./types";
import { isEqual } from "@chillwhales/utils";

/**
 * Parse a CompactBytesArray of bytes values using erc725.js
 *
 * @param data - The CompactBytesArray encoded data
 * @param address - The controller address (used as dynamic key part)
 * @returns Array of hex values
 *
 * @see https://docs.lukso.tech/tools/dapps/erc725js/methods/#tuple-of-compactbytesarray-example
 *
 * @example
 * ```typescript
 * const keys = parseCompactBytesArray('0x...', '0x1234...');
 * // ['0x1234...', '0x5678...']
 * ```
 */
export function parseCompactBytesArray(data: Hex, address: Address): Hex[] {
  try {
    const decoded = ERC725.decodeData(
      [
        {
          keyName: "AddressPermissions:AllowedERC725YDataKeys:<address>",
          dynamicKeyParts: address,
          value: data,
        },
      ],
      LSP6Schemas,
    );

    if (!decoded[0]) return [];

    const value = decoded[0].value;

    if (
      !value ||
      !Array.isArray(value) ||
      !value.every((value) => typeof value === "string")
    ) {
      return [];
    }

    return value.filter((value): value is Hex => isHex(value));
  } catch {
    // If ERC725.decodeData throws (malformed data, null pointers, etc.), return empty array
    return [];
  }
}

/**
 * Parse AllowedCalls using erc725.js decodeData
 *
 * @param data - The encoded AllowedCalls data
 * @param address - The controller address (used as dynamic key part)
 * @returns Array of AllowedCall objects
 *
 * @example
 * ```typescript
 * const calls = parseAllowedCalls('0x1234...', '0x...');
 * // [{ callTypes: '0x...', address: '0x...', interfaceId: '0x...', functionSelector: '0x...' }]
 * ```
 */
export function parseAllowedCalls(data: Hex, address: Address): AllowedCall[] {
  try {
    const decoded = ERC725.decodeData(
      [
        {
          keyName: "AddressPermissions:AllowedCalls:<address>",
          dynamicKeyParts: address,
          value: data,
        },
      ],
      LSP6Schemas,
    );

    if (!decoded || !decoded[0] || !decoded[0].value) return [];

    const value = decoded[0].value;

    if (!Array.isArray(value)) {
      return [];
    }

    const results: AllowedCall[] = [];

    // Process each entry with individual error handling
    for (const call of value) {
      try {
        // Validate that each entry is an array with exactly 4 elements
        if (!Array.isArray(call) || call.length !== 4) {
          continue;
        }

        const [callTypes, addressValue, interfaceId, functionSelector] = call;

        // Validate each element is a string
        if (
          typeof callTypes !== "string" ||
          typeof addressValue !== "string" ||
          typeof interfaceId !== "string" ||
          typeof functionSelector !== "string"
        ) {
          continue;
        }

        // Validate hex values
        if (
          !isHex(callTypes) ||
          !isHex(interfaceId) ||
          !isHex(functionSelector)
        ) {
          continue;
        }

        // Validate address format (should be a valid hex string that can be parsed by getAddress)
        if (!addressValue.startsWith("0x") || addressValue.length !== 42) {
          continue;
        }

        // Try to create the AllowedCall object
        const allowedCall: AllowedCall = {
          callTypes: callTypes,
          address: getAddress(addressValue), // This may throw if address is invalid
          interfaceId: interfaceId,
          functionSelector: functionSelector,
        };

        results.push(allowedCall);
      } catch {
        // Skip this entry if any validation or processing fails
        continue;
      }
    }

    return results;
  } catch {
    // If ERC725.decodeData or any other operation throws, return empty array
    return [];
  }
}

/**
 * Checks if an actual allowed call matches a required allowed call
 *
 * Supports wildcard matching:
 * - Address `0xFFfF...fF` = any address
 * - Interface ID `0xffffffff` = any interface
 * - Function selector `0xffffffff` = any function
 *
 * @param current - The actual allowed call from the controller
 * @param required - The required allowed call configuration
 * @returns Match result with details about each field
 */
export function allowedCallMatches(
  current: {
    callTypes: Hex;
    address: Hex;
    interfaceId: Hex;
    functionSelector: Hex;
  },
  required: {
    callTypes: Hex;
    address: Hex;
    interfaceId: Hex;
    functionSelector: Hex;
  },
) {
  // Call types must match (bitwise check - actual must have at least required bits)
  const currentCallTypes = parseInt(current.callTypes, 16);
  const requiredCallTypes = parseInt(required.callTypes, 16);
  if ((currentCallTypes & requiredCallTypes) !== requiredCallTypes) {
    return {
      isEqual: false,
      excessiveAllowedCallTypes: false,
      excessiveAllowedAddress: false,
      excessiveAllowedInterfaceId: false,
      excessiveAllowedFunction: false,
    };
  }

  const excessiveAllowedCallTypes = currentCallTypes !== requiredCallTypes;

  // Address: 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF means "any address"
  const anyAddress = "0xffffffffffffffffffffffffffffffffffffffff";
  if (
    !isEqual(current.address, anyAddress) &&
    !isEqual(current.address, required.address)
  ) {
    return {
      isEqual: false,
      excessiveAllowedCallTypes,
      excessiveAllowedAddress: false,
      excessiveAllowedInterfaceId: false,
      excessiveAllowedFunction: false,
    };
  }

  const excessiveAllowedAddress = !isEqual(current.address, required.address);

  // Interface ID: 0xffffffff means "any interface"
  const anyInterface = "0xffffffff";
  if (
    !isEqual(current.interfaceId, anyInterface) &&
    !isEqual(current.interfaceId, required.interfaceId)
  ) {
    return {
      isEqual: false,
      excessiveAllowedCallTypes,
      excessiveAllowedAddress,
      excessiveAllowedInterfaceId: false,
      excessiveAllowedFunction: false,
    };
  }

  const excessiveAllowedInterfaceId = !isEqual(
    current.interfaceId,
    required.interfaceId,
  );

  // Function selector: 0xffffffff means "any function"
  const anyFunction = "0xffffffff";
  if (
    !isEqual(current.functionSelector, anyFunction) &&
    !isEqual(current.functionSelector, required.functionSelector)
  ) {
    return {
      isEqual: false,
      excessiveAllowedCallTypes,
      excessiveAllowedAddress,
      excessiveAllowedInterfaceId,
      excessiveAllowedFunction: false,
    };
  }

  const excessiveAllowedFunction = !isEqual(
    current.functionSelector,
    required.functionSelector,
  );

  return {
    isEqual: true,
    excessiveAllowedCallTypes,
    excessiveAllowedAddress,
    excessiveAllowedInterfaceId,
    excessiveAllowedFunction,
  };
}

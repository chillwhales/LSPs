/**
 * LSP23 Deployment Encoding
 *
 * Generates deployment parameters for Universal Profile creation
 * via the LSP23 Linked Contracts Factory on LUKSO.
 *
 * @see https://docs.lukso.tech/standards/smart-contracts/lsp23-linked-contracts-factory
 */

import ERC725 from "@erc725/erc725.js";
import LSP1UniversalReceiverDelegateSchemas from "@erc725/erc725.js/schemas/LSP1UniversalReceiverDelegate.json";
import LSP6KeyManagerSchemas from "@erc725/erc725.js/schemas/LSP6KeyManager.json";
import { universalProfileInitAbi } from "@lukso/universalprofile-contracts/abi";
import {
  type Address,
  encodeAbiParameters,
  encodeFunctionData,
  getAddress,
  isHex,
  toFunctionSelector,
  toHex,
} from "viem";

import {
  IMPLEMENTATIONS,
  LSP23_POST_DEPLOYMENT_MODULE,
  UNIVERSAL_RECEIVER_ADDRESS,
} from "./constants";
import type { DeployParams } from "./types";

/**
 * Generate deployment parameters for Universal Profile
 *
 * Creates the initialization structs needed to deploy a Universal Profile
 * via the LSP23 Linked Contracts Factory.
 *
 * @param salt - 32-byte hex salt for deterministic deployment (0x + 64 hex chars)
 * @param controllerAddress - Address of the main controller (will have full permissions)
 * @returns Deployment parameters for LSP23 factory
 *
 * @example
 * ```typescript
 * import { generateDeployParams } from '@chillwhales/lsp23';
 *
 * const params = generateDeployParams({
 *   salt: '0x' + '00'.repeat(32),
 *   controllerAddress: '0x1234...',
 * });
 * ```
 */
export function generateDeployParams({
  salt,
  controllerAddress,
}: {
  salt: string;
  controllerAddress: Address;
}): DeployParams {
  const universalProfileInitStruct = {
    salt,
    fundingAmount: BigInt(0),
    implementationContract: getAddress(IMPLEMENTATIONS.UNIVERSAL_PROFILE),
    initializationCalldata: encodeFunctionData({
      abi: universalProfileInitAbi,
      functionName: "initialize",
      args: [getAddress(LSP23_POST_DEPLOYMENT_MODULE)],
    }),
  };

  const keyManagerInitStruct = {
    fundingAmount: BigInt(0),
    implementationContract: getAddress(IMPLEMENTATIONS.LSP6_KEY_MANAGER),
    addPrimaryContractAddress: true,
    initializationCalldata: toFunctionSelector(
      "function initialize(address target)",
    ),
    extraInitializationParams: toHex(""),
  };

  // instantiate the erc725 class
  const erc725 = new ERC725([
    ...LSP6KeyManagerSchemas,
    ...LSP1UniversalReceiverDelegateSchemas,
  ]);

  // create the permissions data keys
  const setDataKeysAndValues = erc725.encodeData([
    {
      keyName: "LSP1UniversalReceiverDelegate",
      value: UNIVERSAL_RECEIVER_ADDRESS,
    }, // Universal Receiver data key and value
    {
      keyName: "AddressPermissions:Permissions:<address>",
      dynamicKeyParts: [UNIVERSAL_RECEIVER_ADDRESS],
      value: erc725.encodePermissions({
        REENTRANCY: true,
        SUPER_SETDATA: true,
      }),
    }, // Universal Receiver Delegate permissions data key and value
    {
      keyName: "AddressPermissions:Permissions:<address>",
      dynamicKeyParts: [controllerAddress],
      value: erc725.encodePermissions({
        CHANGEOWNER: true,
        ADDCONTROLLER: true,
        EDITPERMISSIONS: true,
        ADDEXTENSIONS: true,
        CHANGEEXTENSIONS: true,
        ADDUNIVERSALRECEIVERDELEGATE: true,
        CHANGEUNIVERSALRECEIVERDELEGATE: true,
        REENTRANCY: false,
        SUPER_TRANSFERVALUE: true,
        TRANSFERVALUE: true,
        SUPER_CALL: true,
        CALL: true,
        SUPER_STATICCALL: true,
        STATICCALL: true,
        SUPER_DELEGATECALL: false,
        DELEGATECALL: false,
        DEPLOY: true,
        SUPER_SETDATA: true,
        SETDATA: true,
        ENCRYPT: true,
        DECRYPT: true,
        SIGN: true,
        EXECUTE_RELAY_CALL: true,
      }), // Main Controller permissions data key and value
    },
    // Address Permissions array length = 2, and the controller addresses at each index
    {
      keyName: "AddressPermissions[]",
      value: [UNIVERSAL_RECEIVER_ADDRESS, controllerAddress],
    },
  ]);

  const keys = setDataKeysAndValues.keys.filter((value) => isHex(value));
  const values = setDataKeysAndValues.values.filter((value) => isHex(value));

  if (
    keys.length !== setDataKeysAndValues.keys.length ||
    values.length !== setDataKeysAndValues.values.length
  )
    throw new Error("Invalid initialize parameters");

  const initializeEncodedBytes = encodeAbiParameters(
    [{ type: "bytes32[]" }, { type: "bytes[]" }],
    [keys, values],
  );

  return {
    universalProfileInitStruct,
    keyManagerInitStruct,
    initializeEncodedBytes,
  };
}

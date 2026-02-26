import type { Address, Hex } from "viem";

/**
 * Initialization struct for Universal Profile deployment via LSP23.
 */
export interface UniversalProfileInitStruct {
  salt: string;
  fundingAmount: bigint;
  implementationContract: Address;
  initializationCalldata: Hex;
}

/**
 * Initialization struct for Key Manager deployment via LSP23.
 */
export interface KeyManagerInitStruct {
  fundingAmount: bigint;
  implementationContract: Address;
  addPrimaryContractAddress: boolean;
  initializationCalldata: Hex;
  extraInitializationParams: Hex;
}

/**
 * Complete deployment parameters for LSP23 Linked Contracts Factory.
 */
export interface DeployParams {
  universalProfileInitStruct: UniversalProfileInitStruct;
  keyManagerInitStruct: KeyManagerInitStruct;
  initializeEncodedBytes: Hex;
}

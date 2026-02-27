/**
 * LSP23 Linked Contracts Factory Schemas
 *
 * Zod schemas for validating LSP23 deployment parameters.
 *
 * @see https://docs.lukso.tech/standards/smart-contracts/lsp23-linked-contracts-factory
 */

import { addressSchema, bytes32Schema, bytesSchema } from "@chillwhales/lsp2";
import { z } from "zod";

/**
 * Validates a 32-byte hex salt for deterministic deployment
 * Uses LSP2's bytes32Schema
 */
const saltSchema = bytes32Schema;

/**
 * Schema for Universal Profile initialization struct
 */
export const universalProfileInitStructSchema = z.object({
	salt: saltSchema,
	fundingAmount: z.bigint({
		invalid_type_error: "Funding amount must be a bigint",
	}),
	implementationContract: addressSchema,
	initializationCalldata: bytesSchema,
});

/**
 * Schema for Key Manager initialization struct
 */
export const keyManagerInitStructSchema = z.object({
	fundingAmount: z.bigint({
		invalid_type_error: "Funding amount must be a bigint",
	}),
	implementationContract: addressSchema,
	addPrimaryContractAddress: z.boolean({
		invalid_type_error: "addPrimaryContractAddress must be a boolean",
	}),
	initializationCalldata: bytesSchema,
	extraInitializationParams: bytesSchema,
});

/**
 * Schema for complete deployment parameters
 */
export const deployParamsSchema = z.object({
	universalProfileInitStruct: universalProfileInitStructSchema,
	keyManagerInitStruct: keyManagerInitStructSchema,
	initializeEncodedBytes: bytesSchema,
});

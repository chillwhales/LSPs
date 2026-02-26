/**
 * LSP2 Shared Primitive Schemas
 *
 * Reusable Zod schemas for LSP2/LSP3/LSP4 metadata validation.
 * These are the foundation schemas that downstream packages depend on.
 *
 * @see https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-2-ERC725YJSONSchema.md
 */

import { z } from "zod";
import { VERIFICATION_METHODS } from "./constants";

/**
 * Regex for validating Ethereum addresses (0x + 40 hex chars)
 */
const EVM_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;

/**
 * Regex for validating 32-byte hex strings (0x + 64 hex chars)
 */
const BYTES32_REGEX = /^0x[0-9a-fA-F]{64}$/;

/**
 * Regex for validating hex strings (0x + any number of hex chars)
 */
const BYTES_REGEX = /^0x[0-9a-fA-F]*$/;

/**
 * Validates an Ethereum address (0x... format)
 */
export const addressSchema = z
  .string({
    invalid_type_error: "Invalid value, not a string",
  })
  .regex(EVM_ADDRESS_REGEX, "Invalid value, not an Address");

/**
 * Validates a 32-byte hex string (0x + 64 chars)
 */
export const bytes32Schema = z
  .string({
    invalid_type_error: "Invalid value, not a string",
  })
  .regex(BYTES32_REGEX, "Invalid value, not 32 bytes hex");

/**
 * Validates any hex string (0x...)
 */
export const bytesSchema = z
  .string({
    invalid_type_error: "Invalid value, not a string",
  })
  .regex(BYTES_REGEX, "Invalid value, not hex");

// ============================================================================
// LUKSO Standard Primitives (LSP2/LSP3/LSP4)
// ============================================================================

/**
 * Verification data schema for LSP2 ERC725YJSONSchema
 */
export const verificationSchema = z.object({
  data: bytes32Schema,
  method: z.enum([
    VERIFICATION_METHODS.HASH_KECCAK256_BYTES,
    VERIFICATION_METHODS.HASH_KECCAK256_UTF8,
  ]),
});

/**
 * Image metadata schema (LSP3/LSP4)
 */
export const imageSchema = z.object({
  url: z.string({ invalid_type_error: "Invalid value, not a string" }),
  width: z.number({ invalid_type_error: "Invalid value, not a number" }),
  height: z.number({ invalid_type_error: "Invalid value, not a number" }),
  verification: verificationSchema,
});

/**
 * Asset metadata schema (LSP3/LSP4)
 */
export const assetSchema = z.object({
  url: z.string({ invalid_type_error: "Invalid value, not a string" }),
  fileType: z.string({ invalid_type_error: "Invalid value, not a string" }),
  verification: verificationSchema,
});

/**
 * Link schema (LSP3/LSP4)
 */
export const linkSchema = z.object({
  title: z.string({ invalid_type_error: "Invalid value, not a string" }),
  url: z
    .string({ invalid_type_error: "Invalid value, not a string" })
    .url("Invalid value, not a URL"),
});

/**
 * Tag schema (LSP3/LSP4)
 */
export const tagSchema = z.string({
  invalid_type_error: "Invalid value, not a string",
});

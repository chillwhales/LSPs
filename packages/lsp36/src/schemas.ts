import { z } from "zod";

/** Ethereum address — 0x followed by 40 hex characters */
export const addressSchema = z
	.string({ error: "Address must be a string" })
	.regex(/^0x[0-9a-fA-F]{40}$/, "Address must be 0x followed by 40 hex characters");

/** bytes4 — 0x followed by 8 hex characters */
export const bytes4Schema = z
	.string({ error: "bytes4 must be a string" })
	.regex(/^0x[0-9a-fA-F]{8}$/, "bytes4 must be 0x followed by 8 hex characters");

/** bytes32 — 0x followed by 64 hex characters */
export const bytes32Schema = z
	.string({ error: "bytes32 must be a string" })
	.regex(/^0x[0-9a-fA-F]{64}$/, "bytes32 must be 0x followed by 64 hex characters");

/** Non-negative bigint schema for uint256 fields */
const uint256Schema = z
	.bigint({ error: "Must be a bigint" })
	.nonnegative("Must be a non-negative bigint");

/** Non-negative bigint schema for uint48 fields (range enforced at application level) */
const uint48Schema = z
	.bigint({ error: "Must be a bigint" })
	.nonnegative("Must be a non-negative bigint");

/** Zod schema for the LSP36 SignedAuthorization — all 12 fields */
export const signedAuthorizationSchema = z.object({
	/** Address of the signer granting authorization */
	signer: addressSchema,
	/** Target contract address */
	target: addressSchema,
	/** Function selector (bytes4) */
	selector: bytes4Schema,
	/** Array of parameter values (bytes32 each) */
	paramValues: z.array(bytes32Schema, {
		error: "paramValues must be an array of bytes32",
	}),
	/** Bitmask indicating wildcard parameters */
	paramWildcards: uint256Schema,
	/** Bitmask indicating dynamic-length parameters */
	paramDynamicMask: uint256Schema,
	/** Whether the value field is a wildcard */
	valueIsWildcard: z.boolean({ error: "valueIsWildcard must be a boolean" }),
	/** ETH value for the call */
	value: uint256Schema,
	/** Unique signature identifier (bytes32) */
	signatureId: bytes32Schema,
	/** Earliest valid timestamp (uint48) */
	validAfter: uint48Schema,
	/** Latest valid timestamp (uint48) */
	validBefore: uint48Schema,
	/** Replay protection nonce */
	nonce: uint256Schema,
});

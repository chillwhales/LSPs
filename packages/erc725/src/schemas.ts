/**
 * Zod schemas for validating ERC725Y key structures.
 */

import { z } from "zod";

/** Schema for a hex string (0x-prefixed) */
const hexString = z.string().regex(/^0x[0-9a-fA-F]*$/);

/** Schema for a 32-byte ERC725Y data key */
export const dataKeySchema = hexString.refine(
	(val) => val.length === 66,
	"Data key must be 32 bytes (66 hex chars with 0x prefix)",
);

/** Schema for an ERC725Y key-value pair */
export const keyValueSchema = z.object({
	key: dataKeySchema,
	value: hexString,
});

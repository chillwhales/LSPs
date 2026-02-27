/**
 * LSP4 Type Guards
 *
 * Runtime type guards for LSP4 schemas.
 */

import type { z } from "zod";
import { attributesSchema, lsp4MetadataSchema } from "./schemas";

/**
 * Type guard for LSP4 attribute schema
 */
export function isAttributesSchema(
	obj: unknown,
): obj is z.infer<typeof attributesSchema> {
	const { success } = attributesSchema.safeParse(obj);
	return success;
}

/**
 * Type guard for LSP4 metadata schema
 */
export function isLsp4MetadataSchema(
	obj: unknown,
): obj is z.infer<typeof lsp4MetadataSchema> {
	const { success } = lsp4MetadataSchema.safeParse(obj);
	return success;
}

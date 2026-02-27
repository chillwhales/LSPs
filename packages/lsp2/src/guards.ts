/**
 * LSP2 Type Guards
 *
 * Runtime type guards using Zod schema validation.
 */

import type { z } from "zod";
import { assetSchema, imageSchema, linkSchema, tagSchema } from "./schemas";

/**
 * Type guard for image schema
 */
export function isImageSchema(
	obj: unknown,
): obj is z.infer<typeof imageSchema> {
	const { success } = imageSchema.safeParse(obj);
	return success;
}

/**
 * Type guard for link schema
 */
export function isLinkSchema(obj: unknown): obj is z.infer<typeof linkSchema> {
	const { success } = linkSchema.safeParse(obj);
	return success;
}

/**
 * Type guard for tag schema
 */
export function isTagSchema(obj: unknown): obj is z.infer<typeof tagSchema> {
	const { success } = tagSchema.safeParse(obj);
	return success;
}

/**
 * Type guard for asset schema
 */
export function isAssetSchema(
	obj: unknown,
): obj is z.infer<typeof assetSchema> {
	const { success } = assetSchema.safeParse(obj);
	return success;
}

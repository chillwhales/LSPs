/**
 * LSP4 Digital Asset Metadata Schemas
 *
 * Zod schemas for validating LSP4 token metadata (LSP7/LSP8).
 *
 * @see https://docs.lukso.tech/standards/tokens/LSP4-Digital-Asset-Metadata
 */

import { assetSchema, imageSchema, linkSchema } from "@chillwhales/lsp2";
import { isNumeric } from "@chillwhales/utils";
import { z } from "zod";

/**
 * Asset attribute schema
 * Supports string, number, and boolean attribute types
 */
export const attributesSchema = z.discriminatedUnion("type", [
	z.object({
		key: z.string({ invalid_type_error: "Invalid value, not a string" }),
		value: z.string({ invalid_type_error: "Invalid value, not a string" }),
		type: z.literal("string"),
	}),
	z.object({
		key: z.string({ invalid_type_error: "Invalid value, not a string" }),
		value: z
			.string({ required_error: "Value required" })
			.refine(isNumeric, "Invalid value, not a number"),
		type: z.literal("number"),
	}),
	z.object({
		key: z.string({ invalid_type_error: "Invalid value, not a string" }),
		value: z.boolean({ invalid_type_error: "Invalid value, not a boolean" }),
		type: z.literal("boolean"),
	}),
]);

/**
 * LSP4 Digital Asset metadata schema
 * Full metadata structure for LSP7/LSP8 tokens
 */
export const lsp4MetadataSchema = z.object({
	name: z
		.string({
			invalid_type_error: "Name must be a string",
		})
		.nullable(),
	description: z
		.string({
			invalid_type_error: "Description must be a string",
		})
		.nullable(),
	category: z
		.string({
			invalid_type_error: "Category must be a string",
		})
		.nullable(),
	links: z.array(linkSchema),
	icon: z.array(imageSchema),
	images: z.array(z.array(imageSchema)),
	assets: z.array(assetSchema),
	attributes: z.array(attributesSchema),
});

/**
 * LSP4 Inferred Types
 *
 * TypeScript types inferred from LSP4 Zod schemas.
 */

import type { z } from "zod";
import type { attributesSchema, lsp4MetadataSchema } from "./schemas";

export type LSP4Attribute = z.infer<typeof attributesSchema>;
export type LSP4Metadata = z.infer<typeof lsp4MetadataSchema>;

/**
 * Extended NFT metadata with optional token identification fields.
 *
 * Adds `tokenName`, `tokenIdFormat`, and `formattedTokenId` on top of
 * standard LSP4 metadata for use with `getNftDisplayName`.
 */
export interface NftMetadata extends LSP4Metadata {
	/** Token collection name (e.g., "CoolCats") */
	tokenName?: string;
	/** Format of the token ID (e.g., "NUMBER", "STRING") */
	tokenIdFormat?: string;
	/** Pre-formatted token ID for display */
	formattedTokenId?: string;
}

/**
 * LSP4 Inferred Types
 *
 * TypeScript types inferred from LSP4 Zod schemas.
 */

import type { z } from "zod";
import type { attributesSchema, lsp4MetadataSchema } from "./schemas";

export type LSP4Attribute = z.infer<typeof attributesSchema>;
export type LSP4Metadata = z.infer<typeof lsp4MetadataSchema>;

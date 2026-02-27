/**
 * LSP3 Inferred Types
 *
 * TypeScript types inferred from LSP3 Zod schemas.
 */

import type { z } from "zod";
import type { lsp3ProfileSchema } from "./schemas";

export type LSP3Profile = z.infer<typeof lsp3ProfileSchema>;

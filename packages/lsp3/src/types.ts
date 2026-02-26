/**
 * LSP3 Inferred Types
 *
 * TypeScript types inferred from LSP3 Zod schemas.
 */

import { z } from "zod";
import { lsp3ProfileSchema } from "./schemas";

export type LSP3Profile = z.infer<typeof lsp3ProfileSchema>;

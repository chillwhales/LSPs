/**
 * LSP3 Type Guards
 *
 * Runtime type guards for LSP3 schemas.
 */

import type { z } from "zod";
import { lsp3ProfileSchema } from "./schemas";

/**
 * Type guard for LSP3 profile schema
 */
export function isLsp3ProfileSchema(
  obj: unknown,
): obj is z.infer<typeof lsp3ProfileSchema> {
  const { success } = lsp3ProfileSchema.safeParse(obj);
  return success;
}

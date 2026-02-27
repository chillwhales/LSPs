/**
 * LSP23 Inferred Types
 *
 * TypeScript types inferred from LSP23 Zod schemas.
 */

import { z } from "zod";
import {
  universalProfileInitStructSchema,
  keyManagerInitStructSchema,
  deployParamsSchema,
} from "./schemas";

/**
 * Initialization struct for Universal Profile deployment via LSP23.
 */
export type UniversalProfileInitStruct = z.infer<
  typeof universalProfileInitStructSchema
>;

/**
 * Initialization struct for Key Manager deployment via LSP23.
 */
export type KeyManagerInitStruct = z.infer<typeof keyManagerInitStructSchema>;

/**
 * Complete deployment parameters for LSP23 Linked Contracts Factory.
 */
export type DeployParams = z.infer<typeof deployParamsSchema>;

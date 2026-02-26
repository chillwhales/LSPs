/**
 * LSP23 Type Guards
 *
 * Runtime type guards for LSP23 schemas.
 */

import type { z } from "zod";
import {
  universalProfileInitStructSchema,
  keyManagerInitStructSchema,
  deployParamsSchema,
} from "./schemas";

/**
 * Type guard for Universal Profile initialization struct
 */
export function isUniversalProfileInitStruct(
  obj: unknown,
): obj is z.infer<typeof universalProfileInitStructSchema> {
  const { success } = universalProfileInitStructSchema.safeParse(obj);
  return success;
}

/**
 * Type guard for Key Manager initialization struct
 */
export function isKeyManagerInitStruct(
  obj: unknown,
): obj is z.infer<typeof keyManagerInitStructSchema> {
  const { success } = keyManagerInitStructSchema.safeParse(obj);
  return success;
}

/**
 * Type guard for complete deployment parameters
 */
export function isDeployParams(
  obj: unknown,
): obj is z.infer<typeof deployParamsSchema> {
  const { success } = deployParamsSchema.safeParse(obj);
  return success;
}
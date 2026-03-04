/**
 * Zod schemas for LSP1 UniversalReceiver type ID validation and event data.
 *
 * @module
 */

import { z } from "zod";
import { TYPE_ID_NAMES } from "./constants";

// ---------------------------------------------------------------------------
// Name validation schema
// ---------------------------------------------------------------------------

/**
 * Zod enum schema for built-in LUKSO LSP1 type ID names.
 *
 * Provides TypeScript autocomplete for all built-in names. Used in
 * filter schemas where `typeIdName` should only accept known names.
 */
export const TypeIdNameSchema = z.enum(TYPE_ID_NAMES);

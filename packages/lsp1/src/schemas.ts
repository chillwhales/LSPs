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

// ---------------------------------------------------------------------------
// Event schema
// ---------------------------------------------------------------------------

/** Schema for a hex string (0x-prefixed) */
const hexString = z.string().regex(/^0x[0-9a-fA-F]*$/);

/** Schema for a decoded UniversalReceiver event */
export const universalReceiverEventSchema = z.object({
	/** Address that triggered the notification (e.g., the token contract) */
	from: hexString,
	/** Value sent with the notification (in wei) */
	value: z.bigint(),
	/** TypeId identifying the notification type (bytes32) */
	typeId: hexString,
	/** Additional data passed with the notification */
	receivedData: hexString,
	/** Value returned by the UniversalReceiver delegate */
	returnedValue: hexString,
});

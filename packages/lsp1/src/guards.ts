/**
 * Type guards for LSP1 UniversalReceiver typeIds.
 *
 * Uses the registry for known-type-id checks and per-LSP constants
 * for category guards (token, ownership, etc.).
 */

import { LSP0_TYPE_IDS } from "@lukso/lsp0-contracts";
import { LSP7_TYPE_IDS } from "@lukso/lsp7-contracts";
import { LSP8_TYPE_IDS } from "@lukso/lsp8-contracts";
import { LSP14_TYPE_IDS } from "@lukso/lsp14-contracts";
import { isKnownTypeIdHex } from "./registry";

/**
 * Check if a hex string is a known LSP1 typeId.
 *
 * @param value - Hex string to check (should be 0x-prefixed, 66 chars for bytes32)
 * @returns true if the value matches a known LSP1 typeId
 */
export function isLsp1TypeId(value: string): boolean {
	return isKnownTypeIdHex(value);
}

/**
 * Check if a typeId corresponds to a token recipient notification.
 *
 * @param typeId - The typeId to check
 * @returns true if the typeId is LSP7 or LSP8 recipient notification
 */
export function isTokenRecipientNotification(typeId: string): boolean {
	const lower = typeId.toLowerCase();
	return (
		lower === LSP7_TYPE_IDS.LSP7Tokens_RecipientNotification.toLowerCase() ||
		lower === LSP8_TYPE_IDS.LSP8Tokens_RecipientNotification.toLowerCase()
	);
}

/**
 * Check if a typeId corresponds to a token sender notification.
 *
 * @param typeId - The typeId to check
 * @returns true if the typeId is LSP7 or LSP8 sender notification
 */
export function isTokenSenderNotification(typeId: string): boolean {
	const lower = typeId.toLowerCase();
	return (
		lower === LSP7_TYPE_IDS.LSP7Tokens_SenderNotification.toLowerCase() ||
		lower === LSP8_TYPE_IDS.LSP8Tokens_SenderNotification.toLowerCase()
	);
}

/**
 * Check if a typeId corresponds to an ownership transfer notification.
 *
 * Matches LSP0 and LSP14 ownership transferred sender/recipient notifications.
 *
 * @param typeId - The typeId to check
 * @returns true if the typeId is an ownership transfer notification
 */
export function isOwnershipNotification(typeId: string): boolean {
	const lower = typeId.toLowerCase();
	return (
		lower ===
			LSP0_TYPE_IDS.LSP0OwnershipTransferred_SenderNotification.toLowerCase() ||
		lower ===
			LSP0_TYPE_IDS.LSP0OwnershipTransferred_RecipientNotification.toLowerCase() ||
		lower ===
			LSP14_TYPE_IDS.LSP14OwnershipTransferred_SenderNotification.toLowerCase() ||
		lower ===
			LSP14_TYPE_IDS.LSP14OwnershipTransferred_RecipientNotification.toLowerCase()
	);
}

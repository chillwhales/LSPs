/**
 * Type guards for LSP1 UniversalReceiver typeIds.
 */

import { LSP1_TYPE_ID_VALUES, type LSP1TypeId } from "./constants";

/**
 * Check if a hex string is a known LSP1 typeId.
 *
 * @param value - Hex string to check (should be 0x-prefixed, 66 chars for bytes32)
 * @returns true if the value matches a known LSP1 typeId
 */
export function isLsp1TypeId(value: string): value is LSP1TypeId {
	return (LSP1_TYPE_ID_VALUES as readonly string[]).includes(value);
}

/**
 * Check if a typeId corresponds to a token recipient notification.
 *
 * @param typeId - The typeId to check
 * @returns true if the typeId is LSP7 or LSP8 recipient notification
 */
export function isTokenRecipientNotification(typeId: string): boolean {
	return (
		typeId ===
			"0x429ac7a06903dbc9c13dfcb3c9d11df8194581fa047c96d7a4171fc7402958ea" ||
		typeId ===
			"0x0b084a55ebf70fd3c06fd755269dac2212c4d3f0f4d09079780bfa50c1b2984d"
	);
}

/**
 * Check if a typeId corresponds to a token sender notification.
 *
 * @param typeId - The typeId to check
 * @returns true if the typeId is LSP7 or LSP8 sender notification
 */
export function isTokenSenderNotification(typeId: string): boolean {
	return (
		typeId ===
			"0x386072cc5a58e61263b434c722725f21031cd06e7c552cfdb02e04feecfb70c8" ||
		typeId ===
			"0xb23eae7e6d1564b295b4c3e3be402d9a2f0776c57bdf365903496f6fa481ab00"
	);
}

/**
 * Check if a typeId corresponds to an ownership transfer notification.
 *
 * @param typeId - The typeId to check
 * @returns true if the typeId is LSP14 sender or recipient notification
 */
export function isOwnershipNotification(typeId: string): boolean {
	return (
		typeId ===
			"0xa4e59c931d14f7c8a7a35027f92ee40b5f2886b9fdcdb78f30bc5ecce5a2f814" ||
		typeId ===
			"0xe32c7debcb817925ba4883fdbfc52797187f28f73f860641dab1a68d9b32902c"
	);
}

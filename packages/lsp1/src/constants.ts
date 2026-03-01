/**
 * LSP1 UniversalReceiver TypeId Constants
 *
 * Standard typeIds emitted when Universal Profiles receive notifications
 * about asset transfers, ownership changes, and other LSP interactions.
 *
 * The UniversalReceiver event is emitted by LSP0 (ERC725Account) contracts
 * and decoded by the lsp-indexer's universalReceiver plugin.
 *
 * @see https://docs.lukso.tech/standards/universal-profile/lsp1-universal-receiver
 */

import type { Hex } from "viem";

/** TypeId constants for LSP1 UniversalReceiver notifications */
export const LSP1_TYPE_IDS = {
	/** Notification received by the recipient of an LSP7 token transfer */
	LSP7Tokens_RecipientNotification:
		"0x429ac7a06903dbc9c13dfcb3c9d11df8194581fa047c96d7a4171fc7402958ea" as Hex,
	/** Notification sent to the sender of an LSP7 token transfer */
	LSP7Tokens_SenderNotification:
		"0x386072cc5a58e61263b434c722725f21031cd06e7c552cfdb02e04feecfb70c8" as Hex,
	/** Notification received by the recipient of an LSP8 token transfer */
	LSP8Tokens_RecipientNotification:
		"0x0b084a55ebf70fd3c06fd755269dac2212c4d3f0f4d09079780bfa50c1b2984d" as Hex,
	/** Notification sent to the sender of an LSP8 token transfer */
	LSP8Tokens_SenderNotification:
		"0xb23eae7e6d1564b295b4c3e3be402d9a2f0776c57bdf365903496f6fa481ab00" as Hex,
	/** Notification sent to the previous owner after LSP14 ownership transfer */
	LSP14OwnershipTransferred_SenderNotification:
		"0xa4e59c931d14f7c8a7a35027f92ee40b5f2886b9fdcdb78f30bc5ecce5a2f814" as Hex,
	/** Notification received by the new owner after LSP14 ownership transfer */
	LSP14OwnershipTransferred_RecipientNotification:
		"0xe32c7debcb817925ba4883fdbfc52797187f28f73f860641dab1a68d9b32902c" as Hex,
} as const;

/** Union type of all known LSP1 typeId values */
export type LSP1TypeId = (typeof LSP1_TYPE_IDS)[keyof typeof LSP1_TYPE_IDS];

/** All known LSP1 typeId values as an array for iteration */
export const LSP1_TYPE_ID_VALUES = Object.values(LSP1_TYPE_IDS);

/**
 * UniversalReceiver event signature.
 *
 * Event: UniversalReceiver(address from, uint256 value, bytes32 typeId, bytes receivedData, bytes returnedValue)
 *
 * This is the event emitted by LSP0 ERC725Account contracts. The lsp-indexer
 * uses `LSP0ERC725Account.events.UniversalReceiver.topic` for matching.
 */
export const UNIVERSAL_RECEIVER_EVENT_SIGNATURE =
	"UniversalReceiver(address,uint256,bytes32,bytes,bytes)";

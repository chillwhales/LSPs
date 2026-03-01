/**
 * Zod schemas for LSP1 UniversalReceiver event data.
 *
 * The event structure matches the UniversalReceiver event emitted by
 * LSP0 ERC725Account contracts:
 *   UniversalReceiver(address from, uint256 value, bytes32 typeId, bytes receivedData, bytes returnedValue)
 */

import { z } from "zod";

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

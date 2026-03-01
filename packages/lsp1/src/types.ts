import type { Hex } from "viem";
import type { z } from "zod";
import type { universalReceiverEventSchema } from "./schemas";

/** Parsed UniversalReceiver event data */
export type UniversalReceiverEvent = z.infer<
	typeof universalReceiverEventSchema
>;

/** Mapping of typeId to a human-readable notification name */
export interface TypeIdMapping {
	typeId: Hex;
	name: string;
	description: string;
}

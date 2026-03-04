/**
 * Zod schemas for validating ERC725Y key structures.
 */

import { z } from "zod";
import { DATA_KEY_NAMES } from "./constants";

export const DataKeyNameSchema = z.enum(DATA_KEY_NAMES);

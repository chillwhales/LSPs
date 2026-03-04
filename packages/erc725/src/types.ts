import type z from "zod";
import type { DataKeyNameSchema } from "./schemas";

export type DataKeyName = z.infer<typeof DataKeyNameSchema>;

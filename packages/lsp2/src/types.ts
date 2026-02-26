/**
 * LSP2 Inferred Types
 *
 * TypeScript types inferred from LSP2 Zod schemas.
 */

import { z } from "zod";
import {
  verificationSchema,
  imageSchema,
  assetSchema,
  linkSchema,
  tagSchema,
} from "./schemas";

export type Verification = z.infer<typeof verificationSchema>;
export type Image = z.infer<typeof imageSchema>;
export type ImagesArray = Image[];
export type ImagesMatrix = ImagesArray[];
export type Asset = z.infer<typeof assetSchema>;
export type Link = z.infer<typeof linkSchema>;
export type Tag = z.infer<typeof tagSchema>;

/**
 * LSP3 Universal Profile Metadata Schemas
 *
 * Zod schemas for validating LSP3 profile metadata.
 *
 * @see https://docs.lukso.tech/standards/universal-profile/lsp3-profile-metadata
 */

import { z } from "zod";
import {
  assetSchema,
  imageSchema,
  linkSchema,
  tagSchema,
} from "@chillwhales/lsp2";

/**
 * LSP3 Profile metadata schema
 * Full metadata structure for Universal Profiles
 */
export const lsp3ProfileSchema = z.object({
  name: z
    .string({
      invalid_type_error: "Name must be a string",
    })
    .nullable(),
  description: z
    .string({
      invalid_type_error: "Description must be a string",
    })
    .nullable(),
  tags: z.array(tagSchema, {
    invalid_type_error: "Invalid value, not an array",
  }),
  links: z.array(linkSchema),
  avatar: z.array(assetSchema),
  profileImage: z.array(imageSchema),
  backgroundImage: z.array(imageSchema),
});

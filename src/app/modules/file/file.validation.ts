import { fileType } from "@prisma/client";
import { z } from "zod";

// Schema for creating a new file
const createFileSchema = z.object({
  fileName: z.string({ required_error: "File name is required" }),
  fileType: z.nativeEnum(fileType, {
    required_error: "File type is required",
  }),
  fileSize: z.number().int().positive({ message: "File size must be a positive number" }),
  fileUrl: z.string().url({ message: "Invalid URL format" }),
  filePath: z.string().optional(),
});

// Schema for updating a file
const updateFileSchema = z.object({
  fileName: z.string().optional(),
  fileType: z.nativeEnum(fileType).optional(),
  fileSize: z.number().int().positive().optional(),
  fileUrl: z.string().url({ message: "Invalid URL format" }).optional(),
  filePath: z.string().optional(),
});

// Schema for restoring multiple files
const restoreMultipleFilesSchema = z.object({
  ids: z.array(z.string()).nonempty({ message: "At least one file ID must be provided" }),
});

// Schema for toggling favorite status
const toggleFavoriteSchema = z.object({
  isFavorite: z.boolean({ required_error: "isFavorite is required" }),
});

export const fileValidation = {
  createFileSchema,
  updateFileSchema,
  restoreMultipleFilesSchema,
  toggleFavoriteSchema,
};
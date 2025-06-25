import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { fileController } from "./file.controller";
import { fileValidation } from "./file.validation";

const router = express.Router();

// Upload/Create a new file
router.post(
  "/",
  auth(),
  validateRequest(fileValidation.createFileSchema), // Assuming validation schema exists
  fileController.createFile
);

// Get all files (non-deleted)
router.get(
  "/",
  auth(),
  fileController.getAllFiles
);

// Get single file by ID
router.get(
  "/:fileId",
  auth(),
  fileController.getFileById
);

// Get all files uploaded by a specific user
router.get(
  "/user/:userId",
  auth(),
  fileController.getFilesByUserId
);

// Soft delete a file
router.delete(
  "/:fileId",
  auth(),
  fileController.deleteFile
);

// Restore a soft-deleted file
router.patch(
  "/restore/:fileId",
  auth(),
  fileController.restoreFile
);

// Restore multiple soft-deleted files
router.patch(
  "/restore-multiple",
  auth(),
  validateRequest(fileValidation.restoreMultipleFilesSchema), // Optional but recommended
  fileController.restoreMultipleFiles
);

// Permanently delete a file (hard delete)
router.delete(
  "/permanent/:fileId",
  auth(),
  fileController.hardDeleteFile
);

// Update file metadata
router.patch(
  "/:fileId",
  auth(),
  validateRequest(fileValidation.updateFileSchema),
  fileController.updateFile
);

// Mark/unmark as favorite
router.patch(
  "/favourite/:fileId",
  auth(),
  fileController.makeFavourite
);

export const fileRoutes = router;
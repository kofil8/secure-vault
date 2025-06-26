// file.routes.ts
import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { fileController } from './file.controller';
import { fileValidation } from './file.validation';
import upload from '../../../helpars/fileUploader';

const router = express.Router();

// Upload single or multiple files
router.post(
  '/',
  auth(),
  upload.fields([
    { name: 'file', maxCount: 1 }, // for single
    { name: 'files', maxCount: 10 }, // for multiple
  ]),
  fileController.createFile,
);

// Get all files (non-deleted)
router.get('/', auth(), fileController.getAllFiles);

// Get single file by ID
router.get('/:fileId', auth(), fileController.getFileById);

// Get all files uploaded by a specific user
router.get('/user/:userId', auth(), fileController.getFilesByUserId);

// Soft delete a file
router.delete('/:fileId', auth(), fileController.deleteFile);

// Restore a soft-deleted file
router.patch('/restore/:fileId', auth(), fileController.restoreFile);

// Restore multiple soft-deleted files
router.patch(
  '/restore-multiple',
  auth(),
  validateRequest(fileValidation.restoreMultipleFilesSchema),
  fileController.restoreMultipleFiles,
);

// Permanently delete a file (hard delete)
router.delete('/permanent/:fileId', auth(), fileController.hardDeleteFile);

// Update file metadata
router.patch(
  '/:fileId',
  auth(),
  validateRequest(fileValidation.updateFileSchema),
  fileController.updateFile,
);

// Mark/unmark as favorite
router.patch('/favourite/:fileId', auth(), fileController.makeFavourite);

export const fileRoutes = router;

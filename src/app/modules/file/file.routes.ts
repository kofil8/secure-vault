import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { fileController } from './file.controller';
import { fileValidation } from './file.validation';
import upload from '../../../helpars/fileUploader';
import { auth } from '../../middlewares/auth';

const router = express.Router();

// Upload single or multiple files
router.post(
  '/',
  auth(),
  upload.fields([
    { name: 'file', maxCount: 1 }, // single upload
    { name: 'files', maxCount: 10 }, // multiple upload
  ]),
  fileController.createFile,
);

// Get all non-deleted files
router.get('/', auth(), fileController.getAllFiles);

// Get all files uploaded by a specific user
router.get('/user/:userId', auth(), fileController.getFilesByUserId);

// Soft delete a file
router.delete('/:fileId', auth(), fileController.deleteFile);

// Restore a soft-deleted file
router.patch('/restore/:fileId', auth(), fileController.restoreFile);

// Restore multiple files
router.patch(
  '/restore-multiple',
  auth(),
  validateRequest(fileValidation.restoreMultipleFilesSchema),
  fileController.restoreMultipleFiles,
);

// Hard delete
router.delete('/permanent/:fileId', auth(), fileController.hardDeleteFile);

// Update file metadata
router.patch(
  '/:fileId',
  auth(),
  validateRequest(fileValidation.updateFileSchema),
  fileController.updateFile,
);

// Mark or unmark file as favorite
router.patch('/favourite/:fileId', auth(), fileController.makeFavourite);

// ✅ OnlyOffice Editor Config
router.post('/editor-config/:fileId', auth(), fileController.getEditorConfig);

// ✅ Save Callback (for OnlyOffice save events - Step 6)
router.post('/save-callback/:fileId', fileController.handleSaveCallback);

// Get a file by ID
router.get('/:fileId', auth(), fileController.getFileById);

export const fileRoutes = router;

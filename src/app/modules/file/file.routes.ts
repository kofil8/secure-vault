import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { fileController } from './file.controller';
import { fileValidation } from './file.validation';
import { auth } from '../../middlewares/auth';
import upload from '../../../helpars/fileUploader';

const router = express.Router();

// Upload single or multiple files (PDF/DOCX/XLSX)
// Uses multer to handle file uploads and validate file types
router.post(
  '/',
  auth(), // Ensure the user is authenticated
  upload.fields([
    { name: 'file', maxCount: 1 }, // single file upload
    { name: 'files', maxCount: 10 }, // multiple files upload
  ]),
  fileController.createFile, // Create file logic
);

// Get all non-deleted files from the database
router.get('/', auth(), fileController.getAllFiles);

// Get all files uploaded by a specific user (user ID is passed as a parameter)
router.get('/user/:userId', auth(), fileController.getFilesByUserId);

// Soft delete a file (mark it as deleted without removing from the database)
router.delete('/:fileId', auth(), fileController.deleteFile);

// Restore a soft-deleted file (undo the deletion)
router.patch('/restore/:fileId', auth(), fileController.restoreFile);

// Restore multiple files in one request
router.patch(
  '/restore-multiple',
  auth(),
  validateRequest(fileValidation.restoreMultipleFilesSchema),
  fileController.restoreMultipleFiles,
);

// Hard delete a file (permanently remove it from the system)
router.delete('/permanent/:fileId', auth(), fileController.hardDeleteFile);

// Update file metadata (like name, type, etc.)
router.patch(
  '/:fileId',
  auth(),
  validateRequest(fileValidation.updateFileSchema),
  fileController.updateFile,
);

// Mark or unmark a file as favorite
router.patch('/favourite/:fileId', auth(), fileController.makeFavourite);

// Get a specific file by its ID
router.get('/:fileId', auth(), fileController.getFileById);

// Route to create a blank file (PDF, DOCX, XLSX)
router.post('/create/:type', auth(), fileController.createBlankFile);

router.get('/download/:fileId', fileController.downloadFile);

//onlyOffice
router.post('/save-callback/:fileId', fileController.handleSaveCallback);
router.get('/editor-config/:fileId', auth(), fileController.getEditorConfig);

export const fileRoutes = router;

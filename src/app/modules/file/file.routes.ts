import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { fileController } from './file.controller';
import { fileValidation } from './file.validation';
import { auth } from '../../middlewares/auth';
import upload from '../../../helpars/fileUploader';

const router = express.Router();

// File Upload Routes
router.post(
  '/',
  auth(),
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'files', maxCount: 10 },
  ]),
  fileController.createFile,
);

// File Management Routes
router.get('/', auth(), fileController.getAllFiles);
router.get('/user/:userId', auth(), fileController.getFilesByUserId);
router.delete('/:fileId', auth(), fileController.deleteFile);
router.patch('/restore/:fileId', auth(), fileController.restoreFile);
router.patch(
  '/restore-multiple',
  auth(),
  validateRequest(fileValidation.restoreMultipleFilesSchema),
  fileController.restoreMultipleFiles,
);
router.delete('/permanent/:fileId', auth(), fileController.hardDeleteFile);

// File Metadata Routes
router.patch(
  '/:fileId',
  auth(),
  validateRequest(fileValidation.updateFileSchema),
  fileController.updateFile,
);
router.patch('/favourite/:fileId', auth(), fileController.makeFavourite);
router.get('/:fileId', fileController.getFileById);

// Blank File Creation
router.post('/create/:type', auth(), fileController.createBlankFile);

// File Download
router.get('/download/:fileId', auth(), fileController.downloadFile);

// Excel File Editing Routes
router.get('/excel/:fileId', fileController.getExcelData);
router.put('/excel/:fileId', fileController.updateExcelData);

export const fileRoutes = router;

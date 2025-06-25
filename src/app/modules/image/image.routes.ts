import express from 'express';
import { fileUploader } from '../../../helpars/fileUploader';
import { validateRequestArray } from '../../middlewares/validateRequest';
import { ImageController } from './image.controller';
import { ImageValidation } from './image.validation';
import auth from '../../middlewares/auth';

const router = express.Router();

// Create image route (POST)
router.post(
  '/',
  auth(),
  fileUploader.upload.single('file'),
  ImageController.createImage,
);

// Create image route (POST)
router.post(
  '/multiple',
  auth(),
  fileUploader.upload.array('files'),
  ImageController.createMultipleImage,
);

// Delete image by ID route (DELETE)
router.delete('/delete', auth(), ImageController.deleteImage);

router.delete(
  '/bulk',
  auth(),
  validateRequestArray(ImageValidation.deleteMultipleImagesSchema),
  ImageController.deleteMultipleImages,
);

export const imageRoutes = router;

import express from 'express';
import { ProfileControllers } from './profile.controller';
import { auth } from '../../middlewares/auth';
import upload from '../../../helpars/fileUploader';
import parseBodyData from '../../../helpars/parseBodyData';

const router = express.Router();

// Authenticated Routes
router.get('/me', auth(), ProfileControllers.getMyProfile);
router.patch(
  '/update',
  auth(),
  parseBodyData,
  upload.single('image'),
  ProfileControllers.updateMyProfile,
);

export const ProfileRouters = router;

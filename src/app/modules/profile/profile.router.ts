import express from 'express';
import { ProfileControllers } from './profile.controller';
import { auth } from '../../middlewares/auth';
import { authReset } from '../../middlewares/authReset';
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
router.patch('/change-password', auth(), ProfileControllers.changePassword);
router.patch(
  '/security-answers',
  auth(),
  ProfileControllers.updateSecurityAnswers,
);

// Public Routes
router.post('/forgot-password', ProfileControllers.forgotPassword);
router.post('/reset-password', authReset(), ProfileControllers.resetPassword);

export const ProfileRouters = router;

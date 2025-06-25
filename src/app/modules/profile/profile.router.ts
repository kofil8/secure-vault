import express from 'express';
import { ProfileControllers } from './profile.controller';
import { authReset } from '../../middlewares/authReset';
import { fileUploader } from '../../../helpars/fileUploader';
import parseBodyData from '../../../helpars/parseBodyData';
import auth from '../../middlewares/auth';

const router = express.Router();

// Authenticated Routes
router.get('/me', auth(), ProfileControllers.getMyProfile);
router.patch(
  '/update',
  auth(),
  parseBodyData,
  fileUploader.upload.single("image"),
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

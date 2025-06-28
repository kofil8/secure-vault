import express from 'express';
import { ProfileControllers } from './profile.controller';
import { auth } from '../../middlewares/auth';
import upload from '../../../helpars/fileUploader';
import parseBodyData from '../../../helpars/parseBodyData';
import validateRequest from '../../middlewares/validateRequest';
import { profileValidation } from './profile.validation';

const router = express.Router();

router.get('/me', auth(), ProfileControllers.getMyProfile);

router.patch(
  '/update',
  auth(),
  parseBodyData,
  upload.single('image'),
  ProfileControllers.updateMyProfile,
);

router.patch(
  '/change-password',
  auth(),
  validateRequest(profileValidation.changePassword),
  ProfileControllers.changePassword,
);

export const ProfileRouters = router;

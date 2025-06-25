import express from 'express';
import { fileUploader } from '../../../helpars/fileUploader';
import parseBodyData from '../../../helpars/parseBodyData';
import { ProfileControllers } from './profile.controller';
import { auth } from '../../middlewares/auth';

const router = express.Router();

router.get('/me', auth(), ProfileControllers.getMyProfile);
router.patch(
  '/update',
  auth(),
  parseBodyData,
  fileUploader.uploadprofileImage,
  ProfileControllers.updateMyProfile,
);

export const ProfileRouters = router;

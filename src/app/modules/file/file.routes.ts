import express from 'express';
import parseBodyData from '../../../helpars/parseBodyData';
import { auth } from '../../middlewares/auth';

import { fileUploader } from '../../../helpars/fileUploader';
import { DonationControllers } from './file.controller';

const router = express.Router();

router.post(
  '/',
  auth(),
  fileUploader.uploadDonationImages,
  parseBodyData,
  DonationControllers.createDonation,
);

router.get('/', auth(), DonationControllers.getAllDonations);

router.get('/:id', auth(), DonationControllers.getSingleDonation);

router.patch(
  '/:id',
  auth(),
  fileUploader.uploadDonationImages,
  parseBodyData,
  DonationControllers.updateDonation,
);

router.delete('/:id', auth(), DonationControllers.deleteDonation);

export const DonationRouters = router;

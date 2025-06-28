import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Secret, SignOptions } from 'jsonwebtoken';
import config from '../../../config';
import { jwtHelpers } from '../../helpers/jwtHelpers';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ProfileServices } from './profile.service';

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const id = req.user?.id as string;

  const result = await ProfileServices.getMyProfileFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile retrieved successfully',
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const id = req.user?.id as string;
  const payload = req.body.bodyData;
  const file = req.file as Express.Multer.File | undefined;
  const result = await ProfileServices.updateMyProfileIntoDB(id, payload, file);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User profile updated successfully',
    data: result,
  });
});

export const ProfileControllers = {
  getMyProfile,
  updateMyProfile,
};

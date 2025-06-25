import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Secret } from 'jsonwebtoken';
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

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email, answers } = req.body;
  const user = await ProfileServices.forgotPassword(email, answers);

  const accessToken = jwtHelpers.generateToken(
    { id: user.id, email: user.email },
    config.jwt.jwt_secret as Secret,
    Number(config.jwt.expires_in),
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Security questions matched successfully',
    data: { accessToken },
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email, newPassword } = req.body;
  const result = await ProfileServices.resetPassword(email, newPassword);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password reset successfully',
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const id = req.user?.id as string;
  const { oldPassword, newPassword } = req.body;
  const result = await ProfileServices.changePassword(
    id,
    oldPassword,
    newPassword,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password changed successfully',
    data: result,
  });
});

const updateSecurityAnswers = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.user?.id as string;
    const answers = req.body.answers;
    const result = await ProfileServices.updateSecurityAnswers(id, answers);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Security answers updated successfully',
      data: result,
    });
  },
);

export const ProfileControllers = {
  getMyProfile,
  updateMyProfile,
  forgotPassword,
  resetPassword,
  changePassword,
  updateSecurityAnswers,
};

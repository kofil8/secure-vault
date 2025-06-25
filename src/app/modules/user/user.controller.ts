import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { UserServices } from './user.service';

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.forgotPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'OTP sent successfully',
    data: result,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const password = req.body.password;
  const accessToken = req.headers.authorization as string;
  const result = await UserServices.resetPassword(accessToken, { password });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Password reset successfully',
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const userId = req.user.id;
  const result = await UserServices.changePassword(userId, payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Password changed successfully',
    data: result,
  });
});

const updateLocation = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { longitude, latitude } = req.body;
  const result = await UserServices.updateLocation(userId, longitude, latitude);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Location updated successfully',
    data: result,
  });
});

const getNearByUsers = catchAsync(async (req: Request, res: Response) => {
  const { longitude, latitude, maxDistance } = req.body;
  const result = await UserServices.getNearByUsers(
    longitude,
    latitude,
    maxDistance,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Nearby users retrieved successfully',
    data: result,
  });
});

export const UserControllers = {
  registerUser,
  resendOtpReg,
  getAllUsers,
  getUserDetails,
  deleteUser,
  forgotPassword,
  resendOtpRest,
  ResetOtpVerify,
  resetPassword,
  verifyOtp,
  changePassword,
  updateLocation,
  getNearByUsers,
};

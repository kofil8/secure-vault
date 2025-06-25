import httpStatus from 'http-status';
import { AuthServices } from './auth.service';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';

const loginUser = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await AuthServices.loginUserFromDB({ email, password });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User successfully logged in',
    data: result,
  });
});

const logoutUser = catchAsync(async (req, res) => {
  const id = req.user.id;
  await AuthServices.logoutUser(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User successfully logged out',
    data: null,
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const token = req.body.refreshToken;
  const result = await AuthServices.refreshAccessToken(token);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'New access token generated successfully',
    data: result,
  });
});

export const AuthControllers = { loginUser, logoutUser, refreshToken };

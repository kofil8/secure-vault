import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AuthServices } from './auth.service';
import { Request, RequestHandler, Response } from 'express';

const loginUser:RequestHandler = catchAsync(async (req, res) => {
  
  const { email, password } = req.body;

  const result = await AuthServices.loginUserFromDB({ email, password });

  res.cookie('accessToken', result.accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
  });

  res.cookie('refreshToken', result.accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User successfully logged in',
    data: result,
  });
});

const logoutUser = catchAsync(async (req:Request, res:Response) => {

  const id = req.user?.id as string;

  await AuthServices.logoutUser(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User successfully logged out',
    data: null,
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      success: false,
      message: 'Authorization token missing',
    });
  }

  const token = authHeader.split(' ')[1];
  const result = await AuthServices.refreshAccessToken(token);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'New access token generated successfully',
    data: result,
  });
});

export const AuthControllers = { loginUser, logoutUser, refreshToken };

import httpStatus from 'http-status';
import { Request, Response, RequestHandler } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AuthServices } from './auth.service';
import prisma from '../../helpers/prisma';
import ApiError from '../../errors/ApiError';

const isProd = process.env.NODE_ENV === 'production';

// Cookie config for login/set
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? ('none' as const) : ('lax' as const),
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

// Cookie config for clear (no maxAge - prevents deprecation)
const clearCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? ('none' as const) : ('lax' as const),
  path: '/',
};

// ----------------------------- LOGIN -----------------------------
const loginUser: RequestHandler = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const result = await AuthServices.loginUserFromDB({ email, password });

  res.cookie('accessToken', result.accessToken, cookieOptions);
  res.cookie('refreshToken', result.refreshToken, cookieOptions);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User successfully logged in',
    data: result,
  });
});

// ----------------------------- LOGOUT -----------------------------
const logoutUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.user?.id as string;
  await AuthServices.logoutUser(id);

  res.clearCookie('accessToken', clearCookieOptions);
  res.clearCookie('refreshToken', clearCookieOptions);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User successfully logged out',
    data: null,
  });
});

// ----------------------------- REFRESH TOKEN -----------------------------
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

  res.cookie('accessToken', result.accessToken, cookieOptions);
  res.cookie('refreshToken', result.refreshToken, cookieOptions);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'New access token generated successfully',
    data: result,
  });
});

// ----------------------------- FORGOT PASSWORD -----------------------------
const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: 'Email not found',
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Security questions retrieved successfully',
    data: {
      questions: [
        user.securityQuestion1,
        user.securityQuestion2,
        user.securityQuestion3,
      ],
    },
  });
});

// ----------------------------- VERIFY SECURITY ANSWERS -----------------------------
const verifySecurityAnswers = catchAsync(async (req, res) => {
  const { email, answers } = req.body;
  const token = await AuthServices.verifyAnswersAndCreateToken(email, answers);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Security answers verified successfully',
    data: { token },
  });
});

// ----------------------------- RESET PASSWORD -----------------------------
const resetPassword = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const { newPassword } = req.body;

  await AuthServices.resetPassword(userId, newPassword);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password reset successful',
    data: null,
  });
});

// ----------------------------- SET SECURITY QUESTIONS -----------------------------
const setSecurityAnswers = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const { questions, answers } = req.body;

  await AuthServices.setSecurityAnswers(userId, questions, answers);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Security questions and answers set successfully',
    data: null,
  });
});

// ----------------------------- GET SECURITY STATUS -----------------------------
const getSecurityStatus = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Security answer status retrieved successfully',
    data: {
      questions: [
        user.securityQuestion1 ?? '',
        user.securityQuestion2 ?? '',
        user.securityQuestion3 ?? '',
      ],
      isSet:
        !!user.securityAnswer1Hash &&
        !!user.securityAnswer2Hash &&
        !!user.securityAnswer3Hash,
    },
  });
});

// ----------------------------- EXPORT CONTROLLERS -----------------------------
export const AuthControllers = {
  loginUser,
  logoutUser,
  refreshToken,
  forgotPassword,
  verifySecurityAnswers,
  resetPassword,
  setSecurityAnswers,
  getSecurityStatus,
};

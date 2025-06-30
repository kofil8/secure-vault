import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AuthServices } from './auth.service';
import { Request, RequestHandler, Response } from 'express';
import { oAuth2Client } from '../google/googleAuth';

const isProd = process.env.NODE_ENV === 'production';

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? ('none' as const) : ('lax' as const),
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

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

const logoutUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.user?.id as string;
  await AuthServices.logoutUser(id);

  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);

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

  res.cookie('accessToken', result.accessToken, cookieOptions);
  res.cookie('refreshToken', result.refreshToken, cookieOptions);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'New access token generated successfully',
    data: result,
  });
});

// New: Forgot Password - Return security questions if user exists
const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  const exists = await AuthServices.doesUserExist(email);
  if (!exists) {
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
        'What is your pet name?',
        'How many pets you have?',
        'What is your elder brother name?',
      ],
    },
  });
});

// New: Verify security answers and return token
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

// New: Reset password
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

// New: Set/update security answers (protected)
const setSecurityAnswers = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const { answers } = req.body;

  await AuthServices.setSecurityAnswers(userId, answers);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Security answers set successfully',
    data: null,
  });
});

// New: Get security answer status (protected)
const getSecurityStatus = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const status = await AuthServices.getSecurityStatus(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Security answer status retrieved successfully',
    data: status,
  });
});

const googleOAuthCallback = catchAsync(async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
    const { tokens } = await oAuth2Client.getToken(code as string);
    oAuth2Client.setCredentials(tokens);

    // Store tokens in session
    req.session.tokens = tokens; // Now TypeScript recognizes 'session'

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Google OAuth authentication successful',
      data: tokens,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to exchange code for tokens' });
  }
});
export const AuthControllers = {
  loginUser,
  logoutUser,
  refreshToken,
  forgotPassword,
  verifySecurityAnswers,
  resetPassword,
  setSecurityAnswers,
  getSecurityStatus,
  googleOAuthCallback,
};

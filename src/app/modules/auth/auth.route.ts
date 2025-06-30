import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { authValidation } from './auth.validation';
import { AuthControllers } from './auth.controller';
import { auth } from '../../middlewares/auth';
import { oAuth2Client } from '../google/googleAuth';
import { google } from 'googleapis';
import sendResponse from '../../utils/sendResponse';

const router = express.Router();

// Existing login/logout/refresh routes
router.post(
  '/login',
  validateRequest(authValidation.loginUser),
  AuthControllers.loginUser,
);
router.post('/logout', auth(), AuthControllers.logoutUser);
router.post(
  '/refresh-token',
  validateRequest(authValidation.refreshToken),
  AuthControllers.refreshToken,
);

// New public routes for password recovery
router.post(
  '/forgot-password',
  validateRequest(authValidation.forgotPassword),
  AuthControllers.forgotPassword,
);
router.post(
  '/verify-answers',
  validateRequest(authValidation.verifySecurityAnswers),
  AuthControllers.verifySecurityAnswers,
);
router.post(
  '/reset-password',
  auth(),
  validateRequest(authValidation.resetPassword),
  AuthControllers.resetPassword,
);

// New protected routes for managing security answers
router.post(
  '/set-security',
  auth(),
  validateRequest(authValidation.setSecurityAnswers),
  AuthControllers.setSecurityAnswers,
);
router.get('/security-status', auth(), AuthControllers.getSecurityStatus);

// Start Google OAuth2 authentication
router.get('/google', (req, res) => {
  const url = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });
  res.redirect(url); // Redirect to Google's OAuth2 page
});

// Handle Google OAuth callback
router.get('/google/callback', AuthControllers.googleOAuthCallback);

export const AuthRouters = router;

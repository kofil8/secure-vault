import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { authValidation } from './auth.validation';
import { AuthControllers } from './auth.controller';
import { auth } from '../../middlewares/auth';


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

export const AuthRouters = router;

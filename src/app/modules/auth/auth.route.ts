import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { authValidation } from './auth.validation';
import { AuthControllers } from './auth.controller';
import { auth } from '../../middlewares/auth';

const router = express.Router();

router.post(
  '/login',
  validateRequest(authValidation.loginUser), // ✅ Correct usage
  AuthControllers.loginUser,
);

router.post(
  '/refresh-token',
  validateRequest(authValidation.refreshToken), // ✅ Validate refresh token
  AuthControllers.refreshToken,
);

router.post('/logout', auth(), AuthControllers.logoutUser);

export const AuthRouters = router;

import express from 'express';
import { auth } from '../../middlewares/auth';
import { AuthControllers } from './auth.controller';
import { authValidation } from './auth.validation';

const router = express.Router();

router.post(
  '/login',
  authValidation(authValidation.loginUser),
  AuthControllers.loginUser,
);

router.post('/logout', auth(), AuthControllers.logoutUser);

router.post('/refresh-token', AuthControllers.refreshToken);

export const AuthRouters = router;

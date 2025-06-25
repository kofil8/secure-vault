import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { authValidation } from './auth.validation';
import { AuthControllers } from './auth.controller';
import { auth } from '../../middlewares/auth';

const router = express.Router();

router.post(
  '/login',
  validateRequest(authValidation.loginUser),
  AuthControllers.loginUser,
);
router.post('/logout', auth(), AuthControllers.logoutUser);
router.post('/refresh-token', AuthControllers.refreshToken);

export const AuthRouters = router;

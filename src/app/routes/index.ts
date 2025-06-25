import express from 'express';
import { AuthRouters } from '../modules/auth/auth.route';
import { ProfileRouters } from '../modules/profile/profile.router';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRouters,
  },
  {
    path: '/profile',
    route: ProfileRouters,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;

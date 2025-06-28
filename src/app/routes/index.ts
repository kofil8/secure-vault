import express from 'express';
import { fileRoutes } from '../modules/file/file.routes';
import { AuthRouters } from '../modules/auth/auth.route';
import { ProfileRouters } from '../modules/profile/profile.routes';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRouters,
  },
  {
    path: '/files',
    route: fileRoutes,
  },
  {
    path: '/profile',
    route: ProfileRouters,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;

import express from 'express';
<<<<<<< Updated upstream
=======
import { fileRoutes } from '../modules/file/file.routes';
// import { imageRoutes } from '../modules/image/image.routes';
>>>>>>> Stashed changes
import { AuthRouters } from '../modules/auth/auth.route';
import { ProfileRouters } from '../modules/profile/profile.router';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRouters,
  },
  // {
  //   path: '/image',
  //   route: imageRoutes,
  // },
  {
<<<<<<< Updated upstream
    path: '/profile',
    route: ProfileRouters,
  },
=======
    path: '/auth',
    route: AuthRouters,
  },
  {
    path: '/profile',
    route: ProfileRouters,
  },
>>>>>>> Stashed changes
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;

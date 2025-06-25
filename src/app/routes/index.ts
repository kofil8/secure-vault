import express from 'express';

const router = express.Router();

const moduleRoutes = [
  // {
  //   path: '/auth',
  //   route: AuthRouters,
  // },
  // {
  //   path: '/users',
  //   route: UserRouters,
  // },
  // {
  //   path: '/profile',
  //   route: ProfileRouters,
  // }
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;

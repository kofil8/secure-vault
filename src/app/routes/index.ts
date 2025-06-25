import express from 'express';
import { fileRoutes } from '../modules/file/file.routes';
import { imageRoutes } from '../modules/image/image.routes';
import { AuthRouters } from '../modules/auth/auth.route';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/file',
    route: fileRoutes,
  },
  {
    path: '/image',
    route: imageRoutes,
  },
  {
    path:"/auth", 
    route:AuthRouters
  }
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;

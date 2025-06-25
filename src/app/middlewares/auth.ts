import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import jwt, { Secret } from 'jsonwebtoken';
import config from '../../config';
import ApiError from '../errors/ApiError';
import prisma from '../helpers/prisma';
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
    };
  }
}

export const auth = () => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          'Authorization header missing or malformed',
        );
      }

      const token = authHeader.split(' ')[1];

      // Safely decode and validate
      const decoded = jwt.verify(token, config.jwt.jwt_secret as Secret) as {
        id: string;
        email: string;
      };

      if (!decoded?.id || !decoded?.email) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token');
      }

      // Check user exists
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
      }

      req.user = { id: decoded.id, email: decoded.email };
      next();
    } catch (error) {
      next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired token'));
    }
  };
};

import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import jwt, {
  Secret,
  TokenExpiredError,
  JsonWebTokenError,
} from 'jsonwebtoken';
import config from '../../config';
import ApiError from '../errors/ApiError';
import prisma from '../helpers/prisma';

// Extend Express Request type to include custom user field
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

    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return next(
        new ApiError(
          httpStatus.UNAUTHORIZED,
          'Authorization header missing or malformed',
        ),
      );
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, config.jwt.jwt_secret as Secret) as {
        id: string;
        email: string;
      };

      if (!decoded?.id || !decoded?.email) {
        return next(
          new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token payload'),
        );
      }

      const user = await prisma.user.findUnique({ where: { id: decoded.id } });

      if (!user) {
        return next(new ApiError(httpStatus.NOT_FOUND, 'User not found'));
      }

      req.user = { id: decoded.id, email: decoded.email };

      next();
      
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return next(
          new ApiError(httpStatus.UNAUTHORIZED, 'Access token has expired'),
        );
      } else if (error instanceof JsonWebTokenError) {
        return next(
          new ApiError(httpStatus.UNAUTHORIZED, 'Invalid access token'),
        );
      }

      return next(
        new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Authentication error'),
      );
    }
  };
};

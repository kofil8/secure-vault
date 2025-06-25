import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import jwt, {
  Secret,
  TokenExpiredError,
  JsonWebTokenError,
} from 'jsonwebtoken';
import config from '../../config';
import ApiError from '../errors/ApiError';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
    };
  }
}

export const authReset = () => {
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

      const decoded = jwt.verify(token, config.jwt.jwt_secret as Secret) as {
        id: string;
        email: string;
      };

      if (!decoded?.id || !decoded?.email) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token payload');
      }

      req.user = { id: decoded.id, email: decoded.email };
      next();
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        next(new ApiError(httpStatus.UNAUTHORIZED, 'Reset token expired'));
      } else if (error instanceof JsonWebTokenError) {
        next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid reset token'));
      } else {
        next(
          new ApiError(
            httpStatus.UNAUTHORIZED,
            'Reset token validation failed',
          ),
        );
      }
    }
  };
};

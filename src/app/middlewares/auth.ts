import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import jwt, {
  JwtPayload,
  Secret,
  TokenExpiredError,
  JsonWebTokenError,
} from 'jsonwebtoken';
import config from '../../config';
import ApiError from '../errors/ApiError';
import prisma from '../helpers/prisma';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
      name: string;
      role?: string;
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
      // ✅ 1. Get token from header or cookie
      const token = extractToken(req);
      if (!token) {
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          'Authorization token is required',
        );
      }

      // ✅ 2. Verify token
      const decoded = jwt.verify(
        token,
        config.jwt.jwt_secret as Secret,
      ) as JwtPayload & {
        id: string;
        email: string;
        name: string;
      };

      // ✅ 3. Validate payload
      if (!decoded?.id || !decoded?.email || !decoded?.name) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token payload');
      }

      // ✅ 4. Ensure user exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      if (!user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
      }

      // ✅ 5. Attach to request
      req.user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
      };

      next();
    } catch (error) {
      handleAuthError(error, next);
    }
  };
};

// 🔍 Check both Authorization header and cookies
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  // ✅ Cookie-based token
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
};

// ⚠️ Handle common JWT errors
const handleAuthError = (error: unknown, next: NextFunction): void => {
  if (error instanceof TokenExpiredError) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Token expired'));
  }
  if (error instanceof JsonWebTokenError) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token'));
  }
  if (error instanceof ApiError) {
    return next(error);
  }
  next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Authentication failed'));
};

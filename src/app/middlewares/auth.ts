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
      // 1. Get token from Authorization header
      const token = extractTokenFromHeader(req);
      if (!token) {
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          'Authorization token required',
        );
      }

      // 2. Verify token
      const decoded = verifyToken(token) as JwtPayload & {
        id: string;
        email: string;
        name: string;
      };

      // 3. Validate token payload
      validateTokenPayload(decoded);

      // 4. Verify user exists in database
      const user = await verifyUserExists(decoded.id);
      if (!user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User no longer exists');
      }

      // 5. Attach user to request
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

// Helper functions for better separation of concerns
const extractTokenFromHeader = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.jwt_secret as Secret) as JwtPayload;
};

const validateTokenPayload = (decoded: JwtPayload): void => {
  if (!decoded?.id || !decoded?.email || !decoded?.name) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token payload');
  }
};

const verifyUserExists = async (userId: string) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });
};

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

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
      name: string;
    };
  }
}

// Authentication middleware
export const auth = () => {
  return async (
    req: Request,
    res: Response, // Re-enable response here if you need to send responses from the middleware
    next: NextFunction,
  ): Promise<void> => {
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(
        new ApiError(
          httpStatus.UNAUTHORIZED,
          'Authorization header missing or malformed',
        ),
      );
    }

    const token = authHeader.split(' ')[1]; // Extract token from header

    try {
      // Verify the JWT token using the secret key from config
      const decoded = jwt.verify(token, config.jwt.jwt_secret as Secret) as {
        id: string;
        email: string;
        name: string;
      };

      // Validate decoded payload
      if (!decoded?.id || !decoded?.email || !decoded?.name) {
        return next(
          new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token payload'),
        );
      }

      // Find the user in the database using the decoded user ID
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });

      // If user is not found, return an error
      if (!user) {
        return next(new ApiError(httpStatus.NOT_FOUND, 'User not found'));
      }

      // Attach user to the request object for later use in the route handlers
      req.user = { id: decoded.id, email: decoded.email, name: decoded.name };

      // Proceed to the next middleware
      next();
    } catch (error) {
      // Handle token expiration error
      if (error instanceof TokenExpiredError) {
        return next(
          new ApiError(httpStatus.UNAUTHORIZED, 'Access token has expired'),
        );
      }
      // Handle invalid token error
      else if (error instanceof JsonWebTokenError) {
        return next(
          new ApiError(httpStatus.UNAUTHORIZED, 'Invalid access token'),
        );
      }

      // Catch any other errors
      return next(
        new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Authentication error'),
      );
    }
  };
};

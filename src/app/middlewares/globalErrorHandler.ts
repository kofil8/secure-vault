import { Prisma } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { ZodError } from 'zod';
import config from '../../config';
import { IGenericErrorMessage } from '../interfaces/error';
import handleValidationError from '../errors/handleValidationError';
import handleZodError from '../errors/handleZodError';
import handleClientError from '../errors/handleClientError';
import ApiError from '../errors/ApiError';

const GlobalErrorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let message = (error as Error).message || 'Something went wrong!';
  let errorMessages: IGenericErrorMessage[] = [];

  if (error instanceof Prisma.PrismaClientValidationError) {
    const simplified = handleValidationError(error);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorMessages = simplified.errorMessages;
  } else if (error instanceof ZodError) {
    const simplified = handleZodError(error);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorMessages = simplified.errorMessages;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const simplified = handleClientError(error);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorMessages = simplified.errorMessages;
  } else if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    errorMessages = [{ path: '', message }];
  } else if (error instanceof Error) {
    message = error.message;
    errorMessages = [{ path: '', message }];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    stack:
      config.env !== 'production' && error instanceof Error
        ? error.stack
        : undefined,
  });

  _next(); // Call next to pass the error to the next middleware
};

export default GlobalErrorHandler;

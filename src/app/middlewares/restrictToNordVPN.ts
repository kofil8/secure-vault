import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import ApiError from '../errors/ApiError';

// Replace with your actual NordVPN dedicated IP address
const ALLOWED_NORDVPN_IP = '123.45.67.89';

export const restrictToNordVPN = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const forwardedFor = req.headers['x-forwarded-for'] as string;
    const ip = forwardedFor
      ? forwardedFor.split(',')[0].trim()
      : req.socket.remoteAddress;

    console.log(`Client IP: ${ip}`);

    if (!ip || !ip.includes(ALLOWED_NORDVPN_IP)) {
      return next(
        new ApiError(
          httpStatus.FORBIDDEN,
          'Access denied: Only accessible via NordVPN IP',
        ),
      );
    }

    next();
  };
};

import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

// ✅ Add your allowed NordVPN dedicated IPs here
const allowedIps = [
  '192.168.0.108', // Replace with your real NordVPN dedicated IP
];

// 📝 Log rejected attempts
const logPath = path.join(__dirname, '..', 'logs', 'rejected-ips.log');
if (!fs.existsSync(path.dirname(logPath))) {
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
}

export const restrictToDedicatedIP = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const clientIpRaw =
    req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const clientIp = Array.isArray(clientIpRaw) ? clientIpRaw[0] : clientIpRaw;

  const isAllowed = allowedIps.some((ip) => clientIp.includes(ip));
  if (isAllowed) {
    next();
    return;
  }

  // Log the blocked IP with URL and timestamp
  const logEntry = `[${new Date().toISOString()}] Rejected IP: ${clientIp} | URL: ${req.originalUrl}\n`;
  fs.appendFileSync(logPath, logEntry);

  res.status(403).json({
    message:
      'Access restricted. Please connect using the authorized NordVPN IP.',
  });
};

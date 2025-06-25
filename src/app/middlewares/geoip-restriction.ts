import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import geoip from 'geoip-lite';
import path from 'path';

// ✅ Add your NordVPN dedicated IPs here
const allowedIps = [
  '192.168.0.108', // Your dedicated NordVPN IP
];

// 🌍 ISO country codes allowed
const allowedCountries = ['US', 'DE', 'UK', 'NL', 'FR', 'CA', 'BN'];

// 📁 Log file setup
const logDir = path.join(__dirname, '..', 'logs');
const logPath = path.join(logDir, 'geoip-rejected.log');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

/**
 * Middleware: Restrict access to specific IPs and countries
 */
export const geoIpRestriction = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const rawIp =
    req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const ip = Array.isArray(rawIp)
    ? rawIp[0]
    : rawIp.toString().replace('::ffff:', '').trim();

  // Allow localhost during development
  if (ip === '127.0.0.1' || ip === '::1') return next();

  const geo = geoip.lookup(ip);
  const country = geo?.country || 'Unknown';

  const isAllowed =
    allowedIps.includes(ip) ||
    (country !== 'Unknown' && allowedCountries.includes(country));

  if (isAllowed) return next();

  const logEntry = `[${new Date().toISOString()}] ❌ BLOCKED IP: ${ip} | Country: ${country} | URL: ${req.originalUrl}\n`;
  try {
    fs.appendFileSync(logPath, logEntry);
  } catch (err) {
    console.error('❌ Failed to write to geoip log:', err);
  }

  res.status(403).json({
    success: false,
    message:
      'Access denied. Use authorized VPN IP or connect from an allowed country.',
    yourIp: ip,
    yourCountry: country,
  });
};

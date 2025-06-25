import { NextFunction, Request, Response } from "express";
import { CookieOptions } from "express";
import { Details } from "express-useragent";

declare global {
  namespace Express {
    interface Request {
      useragent?: Details;
    }
  }
}

export const antiTrackingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Remove identifying headers
  res.removeHeader("X-Powered-By");
  res.removeHeader("Server");

  // Set comprehensive security headers
  const securityHeaders = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "microphone=(), camera=(), geolocation=()",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; media-src 'self'; object-src 'none'; frame-src 'none'",
  };

  Object.entries(securityHeaders).forEach(([header, value]) => {
    res.setHeader(header, value);
  });

  // Normalize user agent data
  if (req.useragent) {
    const standardizedAgent = {
      browser: "Standard Browser",
      version: "1.0",
      os: "Generic OS",
      platform: "Unknown",
      source: "",
      isMobile: false,
      isDesktop: true,
      isBot: false,
    };

    Object.assign(req.useragent, standardizedAgent);
  }

  next();
};

export const secureCookies = (res: Response, next: NextFunction) => {
  const originalCookie = res.cookie;

  res.cookie = function (
    name: string,
    value: string,
    options: CookieOptions = {}
  ) {
    const isProduction = process.env.NODE_ENV === "production";
    const domain = process.env.COOKIE_DOMAIN || undefined;

    const secureOptions: CookieOptions = {
      ...options,
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      path: "/",
      domain,
      maxAge: options.maxAge || 86400000, // 1 day default
    };

    // Remove undefined options to avoid type issues
    Object.keys(secureOptions).forEach(
      (key) =>
        secureOptions[key as keyof CookieOptions] === undefined &&
        delete secureOptions[key as keyof CookieOptions]
    );

    // Pass secureOptions to the original cookie function
    return originalCookie(name, value, secureOptions);
  };

  next();
};

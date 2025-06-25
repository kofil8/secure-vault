import rateLimit from "express-rate-limit";

/**
 * Default rate limiter for general API usage
 */
export const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    message: "Too many requests from this IP, please try again later."
  }
});

/**
 * Stricter limiter for login attempts
 */
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: {
    message: "Too many login attempts. Please try again after 10 minutes."
  }
});

/**
 * Custom limiter builder (if needed dynamically)
 */
export const createRateLimiter = (max: number, minutes: number) =>
  rateLimit({
    windowMs: minutes * 60 * 1000,
    max,
    message: {
      message: `Too many requests. Try again after ${minutes} minutes.`
    }
  });

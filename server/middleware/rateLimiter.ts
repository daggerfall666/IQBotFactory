import rateLimit from 'express-rate-limit';
import { type Request, type Response } from 'express';

// Base rate limiter configuration
const createLimiter = (options: {
  windowMs: number;
  max: number;
  message: string;
}) => rateLimit({
  windowMs: options.windowMs,
  max: options.max,
  message: options.message,
  handler: (req: Request, res: Response) => {
    console.log('Rate limit exceeded:', {
      ip: req.ip,
      path: req.path,
      windowMs: options.windowMs,
      max: options.max
    });
    res.status(429).json({
      error: 'Too Many Requests',
      message: options.message,
      retryAfter: Math.ceil(options.windowMs / 1000)
    });
  },
  // Add rate limit info to response headers
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for certain paths
  skip: (req) => {
    // Add paths that should skip rate limiting
    const skipPaths = ['/health', '/metrics'];
    return skipPaths.includes(req.path);
  }
});

// General API rate limiter: 100 requests per minute
export const apiLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many requests from this IP, please try again after a minute'
});

// Chat endpoint rate limiter: 30 requests per minute
export const chatLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'Too many chat requests from this IP, please try again after a minute'
});

// Admin endpoints rate limiter: 20 requests per minute
export const adminLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: 'Too many admin requests from this IP, please try again after a minute'
});

// Knowledge base upload limiter: 10 requests per minute
export const uploadLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many upload requests from this IP, please try again after a minute'
});
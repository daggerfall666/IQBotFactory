import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Generate unique request ID
  const requestId = randomUUID();
  req.headers['x-request-id'] = requestId;

  // Log request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    headers: req.headers,
    ip: req.ip
  });

  // Track response time
  const start = Date.now();

  // Override end to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - start;

    logger.info('Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
    });

    originalEnd.apply(res, args);
  };

  next();
}

// Error logging middleware
export function errorLogger(err: Error, req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id'] as string;

  logger.error('Request error', err, {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    headers: req.headers,
    ip: req.ip
  });

  next(err);
}

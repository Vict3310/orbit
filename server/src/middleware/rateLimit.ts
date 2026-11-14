import type { NextFunction, Request, Response } from 'express';

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Small in-memory limiter suitable for a single demonstration instance.
 * A production deployment would use a shared store.
 */
export function rateLimit(options: { limit: number; windowMs: number }) {
  const buckets = new Map<string, Bucket>();

  return (request: Request, response: Response, next: NextFunction) => {
    const key = request.ip ?? 'unknown';
    const now = Date.now();
    const existing = buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }
    if (existing.count >= options.limit) {
      const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
      response.setHeader('Retry-After', String(retryAfter));
      response.status(429).json({
        error: 'RATE_LIMITED',
        message: 'Too many explanation requests. Local explanations remain available.',
      });
      return;
    }
    existing.count += 1;
    next();
  };
}

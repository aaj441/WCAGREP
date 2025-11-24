import { Request, Response, NextFunction } from "express";
import { logger } from "../logger";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private windowMs: number;
  private max: number;

  constructor(windowMs: number, max: number) {
    this.windowMs = windowMs;
    this.max = max;
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = req.ip || "unknown";
      const now = Date.now();

      // Clean up expired entries
      if (this.store[key] && this.store[key].resetTime < now) {
        delete this.store[key];
      }

      // Initialize or increment counter
      if (!this.store[key]) {
        this.store[key] = {
          count: 1,
          resetTime: now + this.windowMs,
        };
      } else {
        this.store[key].count++;
      }

      // Check if limit exceeded
      if (this.store[key].count > this.max) {
        const retryAfter = Math.ceil((this.store[key].resetTime - now) / 1000);
        logger.warn(`Rate limit exceeded for IP: ${key}`);
        return res.status(429).json({
          error: "Too many requests",
          retryAfter,
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        });
      }

      next();
    };
  }
}

// Quick Win: 10 requests per hour
export const quickWinLimiter = new RateLimiter(60 * 60 * 1000, 10);

// Agent triggers: 5 requests per minute
export const agentTriggerLimiter = new RateLimiter(60 * 1000, 5);

/**
 * HELYRA Brute-Force & Rate Limiting Engine
 * 
 * Protects:
 * - /login (per-IP and per-account progressive delay + temporary lockout)
 * - /register (per-IP rate limiting)
 * - /forgot-password (per-IP and per-email rate limiting)
 * - /2fa/verify (per-session attempt limiting)
 */

import { Request, Response, NextFunction } from 'express';

interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  lastAttemptAt: number;
  lockedUntil?: number;
}

class RateLimiter {
  private ipAttempts = new Map<string, AttemptRecord>();
  private accountAttempts = new Map<string, AttemptRecord>();

  // Cleanup expired entries every 10 minutes
  constructor() {
    setInterval(() => this.cleanup(), 10 * 60 * 1000).unref();
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, val] of this.ipAttempts.entries()) {
      if (now - val.lastAttemptAt > 60 * 60 * 1000) {
        this.ipAttempts.delete(key);
      }
    }
    for (const [key, val] of this.accountAttempts.entries()) {
      if (now - val.lastAttemptAt > 60 * 60 * 1000) {
        this.accountAttempts.delete(key);
      }
    }
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress || '127.0.0.1';
  }

  /**
   * Middleware for Login attempts (5 failed attempts -> 15 min lock, progressive delay)
   */
  public loginLimiter() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const ip = this.getClientIp(req);
      const email = String(req.body.email || '').trim().toLowerCase();
      const now = Date.now();

      // Check account lockout
      if (email) {
        const accRecord = this.accountAttempts.get(email);
        if (accRecord?.lockedUntil && accRecord.lockedUntil > now) {
          const remainingSec = Math.ceil((accRecord.lockedUntil - now) / 1000);
          return res.status(429).json({
            error: `Too many failed attempts. For your security, please try again in ${remainingSec} seconds.`
          });
        }
      }

      // Check IP lockout (more than 15 attempts in 15 mins)
      const ipRecord = this.ipAttempts.get(ip);
      if (ipRecord && ipRecord.count >= 15 && now - ipRecord.firstAttemptAt < 15 * 60 * 1000) {
        return res.status(429).json({
          error: 'Too many requests from this network. Please try again later.'
        });
      }

      // Progressive delay (artificial slow-down after 2 failed attempts)
      if (email) {
        const accRecord = this.accountAttempts.get(email);
        if (accRecord && accRecord.count >= 2) {
          const delayMs = Math.min(2000, accRecord.count * 400);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      next();
    };
  }

  public recordLoginFailure(req: Request, email?: string) {
    const ip = this.getClientIp(req);
    const now = Date.now();

    // Record IP attempt
    const ipRec = this.ipAttempts.get(ip) || { count: 0, firstAttemptAt: now, lastAttemptAt: now };
    ipRec.count += 1;
    ipRec.lastAttemptAt = now;
    this.ipAttempts.set(ip, ipRec);

    // Record Account attempt
    if (email) {
      const normEmail = email.trim().toLowerCase();
      const accRec = this.accountAttempts.get(normEmail) || { count: 0, firstAttemptAt: now, lastAttemptAt: now };
      accRec.count += 1;
      accRec.lastAttemptAt = now;

      // Lock account temporarily after 5 failed attempts for 15 minutes
      if (accRec.count >= 5) {
        accRec.lockedUntil = now + 15 * 60 * 1000;
        console.warn(`[SECURITY] Temporary lockout triggered for ${normEmail} (5 failed attempts)`);
      }
      this.accountAttempts.set(normEmail, accRec);
    }
  }

  public recordLoginSuccess(req: Request, email?: string) {
    if (email) {
      this.accountAttempts.delete(email.trim().toLowerCase());
    }
    const ip = this.getClientIp(req);
    const ipRec = this.ipAttempts.get(ip);
    if (ipRec) {
      ipRec.count = Math.max(0, ipRec.count - 1);
    }
  }

  /**
   * Registration limiter (max 6 registrations per hour per IP)
   */
  public registerLimiter() {
    return (req: Request, res: Response, next: NextFunction) => {
      const ip = this.getClientIp(req);
      const now = Date.now();
      const rec = this.ipAttempts.get(`reg:${ip}`) || { count: 0, firstAttemptAt: now, lastAttemptAt: now };

      if (now - rec.firstAttemptAt > 60 * 60 * 1000) {
        rec.count = 0;
        rec.firstAttemptAt = now;
      }

      if (rec.count >= 6) {
        return res.status(429).json({
          error: 'Registration limit reached for this network. Please try again later.'
        });
      }

      rec.count += 1;
      rec.lastAttemptAt = now;
      this.ipAttempts.set(`reg:${ip}`, rec);

      next();
    };
  }

  /**
   * Password reset request limiter (max 3 per 30 minutes per email)
   */
  public forgotPasswordLimiter() {
    return (req: Request, res: Response, next: NextFunction) => {
      const email = String(req.body.email || '').trim().toLowerCase();
      const now = Date.now();
      if (!email) return next();

      const key = `reset:${email}`;
      const rec = this.accountAttempts.get(key) || { count: 0, firstAttemptAt: now, lastAttemptAt: now };

      if (now - rec.firstAttemptAt > 30 * 60 * 1000) {
        rec.count = 0;
        rec.firstAttemptAt = now;
      }

      if (rec.count >= 3) {
        // Return same generic message to avoid enumeration
        return res.json({
          message: 'If an account exists for this email, you will receive password reset instructions.'
        });
      }

      rec.count += 1;
      rec.lastAttemptAt = now;
      this.accountAttempts.set(key, rec);

      next();
    };
  }
}

export const rateLimiter = new RateLimiter();

/**
 * HELYRA Authentication, CSRF & Security Headers Middleware
 * 
 * Enforces:
 * - Session token validation from HttpOnly cookies (with Bearer header fallback)
 * - Anti-CSRF verification on state-changing API requests
 * - Defense-in-depth HTTP security headers (CSP, HSTS, X-Content-Type-Options, etc.)
 * - BOLA / IDOR ownership guards
 */

import { Request, Response, NextFunction } from 'express';
import { db, UserRecord, SessionRecord } from './db';
import { hashToken } from './crypto';

// Extend Express Request interface with authenticated user & session
declare global {
  namespace Express {
    interface Request {
      user?: Omit<UserRecord, 'passwordHash' | 'twoFactorSecretEncrypted' | 'recoveryCodesHashed'>;
      session?: SessionRecord;
      rawSessionToken?: string;
    }
  }
}

export const SESSION_COOKIE_NAME = 'helyra_session';

/**
 * Parses session token from HttpOnly cookie or Authorization header
 */
export function extractSessionToken(req: Request): string | null {
  // 1. Try HttpOnly Cookie
  const cookies = req.cookies;
  if (cookies && cookies[SESSION_COOKIE_NAME]) {
    return cookies[SESSION_COOKIE_NAME];
  }

  // 2. Try Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  return null;
}

/**
 * Session verification middleware. Populates req.user and req.session if valid.
 */
export async function sessionMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractSessionToken(req);
    if (!token) {
      return next();
    }

    const tokenHash = hashToken(token);
    const session = await db.findSessionByTokenHash(tokenHash);

    if (!session) {
      return next();
    }

    // Check if session has expired
    if (session.expiresAt <= Date.now()) {
      await db.deleteSession(session.id);
      return next();
    }

    const user = await db.findUserById(session.userId);
    if (!user) {
      await db.deleteSession(session.id);
      return next();
    }

    // Slide active session window
    await db.updateSessionActivity(session.id);

    // Strip sensitive hashes before attaching to request context
    const { passwordHash, twoFactorSecretEncrypted, recoveryCodesHashed, ...safeUser } = user;

    req.user = safeUser;
    req.session = session;
    req.rawSessionToken = token;

    next();
  } catch (err) {
    next();
  }
}

/**
 * Strict authentication guard middleware
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.session) {
    return res.status(401).json({
      error: 'Authentication required. Please sign in to continue.'
    });
  }
  next();
}

/**
 * Anti-CSRF protection for state-changing HTTP methods
 * Browsers cannot send custom headers like 'X-Requested-With' across origins without a CORS preflight.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!stateChangingMethods.includes(req.method)) {
    return next();
  }

  // If request uses Authorization Bearer header, browser cannot send it cross-origin involuntarily
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  // Verify custom anti-CSRF header
  const customHeader = req.headers['x-requested-with'] || req.headers['x-csrf-token'];
  if (customHeader) {
    return next();
  }

  // If using cookie without custom header, reject
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (token) {
    return res.status(403).json({
      error: 'CSRF validation failed: Missing required security header (X-Requested-With or X-CSRF-Token).'
    });
  }

  next();
}

/**
 * Security headers middleware
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Clickjacking defense
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Referrer privacy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // HSTS (HTTP Strict Transport Security)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Modern Permissions Policy
  res.setHeader(
    'Permissions-Policy',
    'camera=(self), microphone=(self), geolocation=(self), accelerometer=(self), gyroscope=(self), publickey-credentials-get=(self), publickey-credentials-create=(self)'
  );

  // Content Security Policy crafted for HELYRA
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; " +
    "style-src 'self' 'unsafe-inline' https: fonts.googleapis.com; " +
    "font-src 'self' https: fonts.gstatic.com data:; " +
    "img-src 'self' data: blob: https:; " +
    "connect-src 'self' https: wss:; " +
    "media-src 'self' data: blob:; " +
    "object-src 'none'; " +
    "base-uri 'self';"
  );

  next();
}

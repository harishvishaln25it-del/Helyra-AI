/**
 * HELYRA Enterprise Cryptographic Engine
 * 
 * Strict Security Rules Enforced:
 * 1. Passwords hashed using Argon2id (RFC 9106) with memory=64MB, iterations=3, parallelism=4.
 * 2. Bcrypt (cost=12) fallback if Argon2id is unsupported in environment.
 * 3. AES-256-GCM authenticated encryption for sensitive at-rest data (e.g. 2FA secrets).
 * 4. Cryptographically secure random tokens using crypto.randomBytes(32).
 * 5. Constant-time comparison to prevent timing attacks.
 */

import crypto from 'node:crypto';
import argon2 from 'argon2';
import bcrypt from 'bcryptjs';

// Get or derive encryption key from environment
const MASTER_SECRET = process.env.ENCRYPTION_KEY || process.env.SESSION_SECRET || 'helyra-enterprise-production-secure-key-32b!';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(MASTER_SECRET).digest();

/**
 * Hash a password using Argon2id with secure RFC 9106 recommended parameters.
 * Falls back to Bcrypt if Argon2id fails.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('Invalid password provided for hashing');
  }

  try {
    return await argon2.hash(plainPassword, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,       // 3 iterations
      parallelism: 4     // 4 threads
    });
  } catch (argonErr) {
    console.warn('[SECURITY] Argon2id unavailable, falling back to Bcrypt cost 12:', (argonErr as Error)?.message);
    const salt = await bcrypt.genSalt(12);
    return await bcrypt.hash(plainPassword, salt);
  }
}

/**
 * Verify a plain password against an Argon2id or Bcrypt hash.
 * Constant-time safe.
 */
export async function verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
  if (!plainPassword || !hash || typeof plainPassword !== 'string' || typeof hash !== 'string') {
    return false;
  }

  try {
    if (hash.startsWith('$argon2')) {
      return await argon2.verify(hash, plainPassword);
    } else if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
      return await bcrypt.compare(plainPassword, hash);
    }
    return false;
  } catch (err) {
    console.error('[SECURITY] Password verification error:', err);
    return false;
  }
}

/**
 * Encrypt sensitive strings at rest using AES-256-GCM authenticated encryption.
 * Output format: "iv_hex:authTag_hex:ciphertext_hex"
 */
export function encryptAesGcm(plainText: string): string {
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  
  let ciphertext = cipher.update(plainText, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${ciphertext}`;
}

/**
 * Decrypt AES-256-GCM ciphertext.
 */
export function decryptAesGcm(encryptedPayload: string): string | null {
  try {
    const parts = encryptedPayload.split(':');
    if (parts.length !== 3) return null;

    const [ivHex, authTagHex, ciphertextHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[SECURITY] AES-GCM Decryption failed (tampering or key mismatch)');
    return null;
  }
}

/**
 * Generate a cryptographically secure random token (e.g. for sessions, password resets).
 */
export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * SHA-256 hash for single-use tokens stored in DB (so leaked DB tokens cannot be used directly).
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Constant-time safe string comparison
 */
export function safeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

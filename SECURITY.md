# HELYRA — Enterprise Security Architecture & Policies

This document outlines the cryptographic specifications, authentication workflows, authorization boundaries, and data protection mechanisms implemented in HELYRA.

---

## 1. Authentication Architecture

```text
USER / CLIENT
      ↓  (HTTPS / TLS 1.3)
VITE REACT FRONTEND
      ↓  (Credentials: 'include' + X-Requested-With CSRF Header)
AUTHENTICATION SERVER (Express on Node.js)
      ↓
INPUT SANITIZATION & BRUTE-FORCE RATE LIMITING
      ↓
PASSWORD HASH VERIFICATION (Argon2id RFC 9106)
      ↓
MULTI-FACTOR AUTHENTICATION (TOTP / WebAuthn Passkeys)
      ↓
SESSION ENGINE (HttpOnly, Secure, SameSite=Lax Cookies)
      ↓
AUTHORIZED REST APIS (req.user & BOLA Ownership Verification)
      ↓
ENCRYPTED PERSISTENT DATABASE (0600 file permissions, AES-256-GCM)
```

### Core Tenet
- **Zero Plaintext Passwords**: Passwords exist in memory exclusively for the duration of the hashing operation and are immediately garbage-collected. Passwords are never stored in localStorage, sessionStorage, IndexedDB, cookies, URL query strings, application logs, or browser state.
- **Server-Side Enforcement**: All authorization and identity verification is enforced on the backend. Frontend routing guards serve purely for UX guidance.

---

## 2. Password Hashing Specification

- **Primary Algorithm**: **Argon2id** (RFC 9106)
  - Memory cost: `65,536 KiB` (64 MB)
  - Time cost: `3 iterations`
  - Parallelism: `4 threads`
  - Hash identifier: `$argon2id$v=19$m=65536,t=3,p=4$...`
- **Fallback Algorithm**: **Bcrypt** (cost factor 12) utilized only in environments where native assembly bindings for Argon2id are unavailable.
- **Prohibited Algorithms**: MD5, SHA-1, plain SHA-256, reversible encryption, custom hashing algorithms.

---

## 3. Password Policy & Complexity

Registration and password modification enforce:
- Minimum length: **12 characters**
- Recommended length: **16+ characters** (passphrases encouraged)
- Blacklist check: Rejection of top known breached passwords (`password123456`, `qwertyuiopas`, etc.)
- User context check: Rejection of passwords containing the user's name or email address
- Character variety: Evaluation of uppercase, lowercase, numbers, and symbols

---

## 4. Session Security & Token Lifecycle

- **Cookie Flags**:
  - `HttpOnly = true`: Inaccessible to JavaScript, defending against Cross-Site Scripting (XSS) session theft.
  - `Secure = true`: Transmitted exclusively over encrypted HTTPS connections in production.
  - `SameSite = Lax`: Prevents unauthorized third-party cross-site request forgery.
- **Session Expiration**:
  - Maximum lifetime: 7 days
  - Sliding activity window: Extended upon active requests
- **Session Invalidation**:
  - Explicit sign-out invalidates the session token from the server database and clears client cookies.
  - Password change or reset invalidates all existing sessions.
  - User can inspect active devices (`/api/auth/sessions`) and invoke "Sign Out Everywhere" (`/api/auth/logout-all`).

---

## 5. Multi-Factor Authentication & Passkeys

- **TOTP (RFC 6238)**:
  - 6-digit dynamic codes with 30-second time intervals.
  - TOTP shared secrets encrypted at rest using **AES-256-GCM**.
  - 8 single-use cryptographically random backup recovery codes generated at setup and stored as SHA-256 hashes.
- **WebAuthn / FIDO2 Passkeys**:
  - Hardware-backed biometric authentication (Touch ID, Face ID, Windows Hello, YubiKey).
  - Challenge-response verification via `@simplewebauthn/server` and `@simplewebauthn/browser`.
  - Phishing-resistant public-key cryptography.

---

## 6. Brute-Force & Account Enumeration Defenses

- **Generic Error Responses**: Login failures always return `"Invalid email or password."`, preventing attacker enumeration of registered email addresses.
- **Progressive Delay**: Successive failed login attempts from an IP or email address incur artificial latency (up to 2,000ms).
- **Temporary Lockout**: 5 failed login attempts trigger a 15-minute temporary lockout. Accounts are never permanently locked to avoid Denial-of-Service attacks against legitimate users.
- **Rate Limits**:
  - `/api/auth/login`: Max 15 attempts / 15 mins per IP; progressive backoff per email.
  - `/api/auth/register`: Max 6 registrations / hour per IP.
  - `/api/auth/forgot-password`: Max 3 requests / 30 mins per email.

---

## 7. Authorization & BOLA/IDOR Prevention

Every API route serving sensitive metrics (steps, GPS tracks, medications, medical records):
1. Runs through `requireAuth` middleware to verify session validity.
2. Scopes all database queries strictly to `req.user.id`.
3. Never trusts `userId` supplied in request payloads or URL parameters.

```typescript
// Verified Server Pattern:
healthDataRouter.get('/', requireAuth, (req, res) => {
  const userId = req.user.id; // Server-authoritative ID from validated session
  const data = db.getHealthData(userId);
  return res.json(data);
});
```

---

## 8. Anti-CSRF Protection

State-changing HTTP operations (`POST`, `PUT`, `PATCH`, `DELETE`):
- Require the custom header `X-Requested-With: XMLHttpRequest` or `X-CSRF-Token`.
- Cross-origin requests cannot emit custom HTTP headers without passing explicit CORS preflights.

---

## 9. Defense-in-Depth HTTP Security Headers

Express middleware injects the following headers across all responses:
- `Content-Security-Policy`: Restricts script and asset origins, disallows `object-src`.
- `Strict-Transport-Security`: `max-age=31536000; includeSubDomains` (enforces HTTPS).
- `X-Content-Type-Options`: `nosniff` (prevents MIME-type sniffing).
- `X-Frame-Options`: `SAMEORIGIN` (mitigates clickjacking).
- `Referrer-Policy`: `strict-origin-when-cross-origin`.
- `Permissions-Policy`: Restricts camera, microphone, and motion sensors strictly to self origin.

---

## 10. Data at Rest & Encryption

- **Database Storage**: `.data/helyra_security.json` created with restricted `0600` POSIX file permissions.
- **Atomic Persistence**: Database writes occur via temporary files followed by atomic `renameSync` to avoid data corruption.
- **Sensitive Field Encryption**: Authenticated symmetric encryption (**AES-256-GCM** with 96-bit random IV) encrypts TOTP secrets at rest.
- **Single-Use Tokens**: Password reset and email verification tokens are stored as SHA-256 hashes; plain tokens are never stored in the database.

---

## 11. Account Deletion & Right to Erasure

- Users can permanently terminate their account from **Settings -> Security**.
- Requires password re-authentication before deletion.
- Permanently purges user account, sessions, passkeys, fitness tracks, and health records from disk.

---

## 12. Security Audit Logging

HELYRA maintains an in-memory & file-persisted audit log recording:
- `LOGIN_SUCCESS` (with device and IP)
- `LOGIN_FAILED`
- `LOGOUT` / `LOGOUT_ALL_DEVICES`
- `PASSWORD_CHANGED`
- `PASSWORD_RESET_REQUESTED` / `PASSWORD_RESET_COMPLETED`
- `2FA_ENABLED` / `2FA_DISABLED`
- `PASSKEY_REGISTERED` / `PASSKEY_REMOVED`
- `SESSION_REVOKED`
- `ACCOUNT_DELETED`

*Sensitive parameters (passwords, plaintext tokens, 2FA codes, medical documents) are strictly excluded from all audit logs.*

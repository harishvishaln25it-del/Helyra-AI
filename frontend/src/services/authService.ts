/**
 * HELYRA Client Authentication Service
 * 
 * Strict Security Architecture:
 * - Credentials included on all requests (HttpOnly Cookie session transmission)
 * - Anti-CSRF 'X-Requested-With' header added to all state-changing requests
 * - Never stores passwords in localStorage, sessionStorage, or client state
 * - Passkeys / WebAuthn integration with @simplewebauthn/browser
 */

import {
  startRegistration,
  startAuthentication
} from '@simplewebauthn/browser';

export interface UserSessionInfo {
  id: string;
  ip: string;
  deviceName: string;
  userAgent: string;
  createdAt: string;
  lastActiveAt: number;
  isCurrent: boolean;
}

export interface SecurityEventLog {
  id: string;
  userId?: string;
  userEmail?: string;
  event: string;
  ip: string;
  userAgent: string;
  details?: string;
  timestamp: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'individual' | 'family_admin' | 'elderly';
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  passwordChangedAt: string;
}

export interface SecurityStatus {
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  remainingRecoveryCodes: number;
  passkeyCount: number;
  activeSessionsCount: number;
  passwordChangedAt: string;
  createdAt: string;
}

export interface PasskeyAvailability {
  supported: boolean;
  allowed: boolean;
  isIframe: boolean;
  reason?: string;
}

export function checkPasskeyAvailability(): PasskeyAvailability {
  if (typeof window === 'undefined') {
    return { supported: false, allowed: false, isIframe: false, reason: 'SSR environment' };
  }

  const isIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  if (!window.isSecureContext) {
    return {
      supported: false,
      allowed: false,
      isIframe,
      reason: 'Passkeys require a secure context (HTTPS).'
    };
  }

  if (!window.PublicKeyCredential) {
    return {
      supported: false,
      allowed: false,
      isIframe,
      reason: 'WebAuthn is not supported by this browser.'
    };
  }

  // Check Permissions Policy / Feature Policy on the document
  const doc = document as any;
  if (typeof doc.permissionsPolicy?.allowsFeature === 'function') {
    try {
      if (!doc.permissionsPolicy.allowsFeature('publickey-credentials-get')) {
        return {
          supported: true,
          allowed: false,
          isIframe,
          reason: 'Passkey authentication is restricted in this embedded preview frame by browser Permissions Policy. Please sign in with Email & Password.'
        };
      }
    } catch {
      // ignore
    }
  } else if (typeof doc.featurePolicy?.allowsFeature === 'function') {
    try {
      if (!doc.featurePolicy.allowsFeature('publickey-credentials-get')) {
        return {
          supported: true,
          allowed: false,
          isIframe,
          reason: 'Passkey authentication is restricted in this embedded preview frame by browser Feature Policy. Please sign in with Email & Password.'
        };
      }
    } catch {
      // ignore
    }
  }

  return { supported: true, allowed: true, isIframe };
}

// In-memory token fallback if cookies are blocked in strict browser privacy sandboxes
let inMemorySessionToken: string | null = null;

function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // Anti-CSRF protection
    ...extraHeaders
  };

  if (inMemorySessionToken) {
    headers['Authorization'] = `Bearer ${inMemorySessionToken}`;
  }

  return headers;
}

export const authService = {
  checkPasskeyAvailability(): PasskeyAvailability {
    return checkPasskeyAvailability();
  },

  setSessionToken(token: string | null) {
    inMemorySessionToken = token;
  },

  getSessionToken(): string | null {
    return inMemorySessionToken;
  },

  /**
   * Check current session status & security posture
   */
  async getMe(): Promise<{ authenticated: boolean; user: AuthUser | null; security?: SecurityStatus }> {
    try {
      const res = await fetch('/api/auth/me', {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (!res.ok) return { authenticated: false, user: null };
      return await res.json();
    } catch (err) {
      console.warn('[AUTH] getMe check failed (offline or network error):', err);
      return { authenticated: false, user: null };
    }
  },

  /**
   * Secure Login with Argon2id hash verification
   */
  async login(email: string, password: string): Promise<{
    success?: boolean;
    requires2FA?: boolean;
    tempToken?: string;
    user?: AuthUser;
    sessionToken?: string;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Invalid email or password.' };
      }

      if (data.sessionToken) {
        this.setSessionToken(data.sessionToken);
      }

      return data;
    } catch (err: any) {
      return { error: 'Network error. Could not connect to authentication server.' };
    }
  },

  /**
   * Register new user account with Argon2id hashing & verification email
   */
  async register(payload: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone?: string;
    role?: string;
  }): Promise<{
    success?: boolean;
    message?: string;
    userId?: string;
    devVerificationToken?: string;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Unable to register.' };
      }
      return data;
    } catch (err: any) {
      return { error: 'Network error during registration.' };
    }
  },

  /**
   * Verify 2FA challenge code or recovery code during login
   */
  async verify2FALogin(tempToken: string, code: string, isRecoveryCode = false): Promise<{
    success?: boolean;
    user?: AuthUser;
    sessionToken?: string;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/auth/2fa/verify-login', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ tempToken, code, isRecoveryCode })
      });

      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Verification failed.' };
      }

      if (data.sessionToken) {
        this.setSessionToken(data.sessionToken);
      }

      return data;
    } catch (err: any) {
      return { error: 'Network error during 2FA verification.' };
    }
  },

  /**
   * Logout from current device
   */
  async logout(): Promise<boolean> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
    } catch {}
    this.setSessionToken(null);
    return true;
  },

  /**
   * Logout from all devices
   */
  async logoutAll(): Promise<boolean> {
    try {
      await fetch('/api/auth/logout-all', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
    } catch {}
    this.setSessionToken(null);
    return true;
  },

  /**
   * List active sessions
   */
  async getSessions(): Promise<UserSessionInfo[]> {
    try {
      const res = await fetch('/api/auth/sessions', {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.sessions || [];
    } catch {
      return [];
    }
  },

  /**
   * Revoke single session
   */
  async revokeSession(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/auth/sessions/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Forgot password request
   */
  async forgotPassword(email: string): Promise<{ message: string; devResetToken?: string }> {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ email })
      });
      return await res.json();
    } catch {
      return { message: 'If an account exists for this email, you will receive password reset instructions.' };
    }
  },

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success?: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ token, newPassword })
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Password reset failed.' };
      return data;
    } catch {
      return { error: 'Network error. Could not reset password.' };
    }
  },

  /**
   * Verify email address with token
   */
  async verifyEmail(token: string): Promise<{ success?: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Email verification failed.' };
      return data;
    } catch {
      return { error: 'Network error.' };
    }
  },

  /**
   * Change password for logged-in user
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success?: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Could not change password.' };
      return data;
    } catch {
      return { error: 'Network error.' };
    }
  },

  /**
   * 2FA Setup Initiation
   */
  async setup2FA(): Promise<{ secret: string; otpauthUrl: string; recoveryCodes: string[]; error?: string }> {
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      return await res.json();
    } catch {
      return { secret: '', otpauthUrl: '', recoveryCodes: [], error: 'Failed to start 2FA setup.' };
    }
  },

  /**
   * 2FA Enable Confirmation
   */
  async enable2FA(code: string, secret: string, recoveryCodes: string[]): Promise<{ success?: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ code, secret, recoveryCodes })
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Failed to enable 2FA.' };
      return data;
    } catch {
      return { error: 'Network error.' };
    }
  },

  /**
   * 2FA Disable
   */
  async disable2FA(password: string): Promise<{ success?: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Could not disable 2FA.' };
      return data;
    } catch {
      return { error: 'Network error.' };
    }
  },

  /**
   * Fetch recent security events
   */
  async getSecurityLogs(): Promise<SecurityEventLog[]> {
    try {
      const res = await fetch('/api/auth/security-log', {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.logs || [];
    } catch {
      return [];
    }
  },

  /**
   * Delete Account
   */
  async deleteAccount(password: string): Promise<{ success?: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Account deletion failed.' };
      this.setSessionToken(null);
      return data;
    } catch {
      return { error: 'Network error.' };
    }
  },

  /**
   * Passkeys: Register new Passkey
   */
  async registerPasskey(deviceName = 'My Device'): Promise<{ success?: boolean; message?: string; error?: string }> {
    const availability = checkPasskeyAvailability();
    if (!availability.allowed) {
      return {
        error: availability.reason || 'Passkeys cannot be registered inside an embedded preview frame. Open the app in a standalone tab to register biometrics.'
      };
    }

    try {
      // 1. Get registration options
      const optRes = await fetch('/api/auth/webauthn/register/options', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (!optRes.ok) throw new Error('Could not get registration options');
      const options = await optRes.json();

      // 2. Trigger browser WebAuthn authenticator
      const attResp = await startRegistration({ optionsJSON: options });

      // 3. Send response for verification
      const verifyRes = await fetch('/api/auth/webauthn/register/verify', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ response: attResp, deviceName })
      });

      const data = await verifyRes.json();
      if (!verifyRes.ok) return { error: data.error || 'Passkey verification failed.' };
      return { success: true, message: 'Passkey registered successfully.' };
    } catch (err: any) {
      const errName = err?.name || '';
      const errMsg = err?.message || String(err || '');
      const isPolicyRestriction =
        errName === 'NotAllowedError' &&
        (errMsg.includes('publickey-credentials') ||
         errMsg.includes('Permissions Policy') ||
         errMsg.includes('cross-origin child frames') ||
         errMsg.includes('feature is not enabled in this document'));

      if (isPolicyRestriction) {
        console.info('[WEBAUTHN] Register restricted by iframe Permissions Policy.');
        return {
          error: 'Passkey registration is blocked in embedded iframe previews by browser Permissions Policy. Use standalone mode to register biometrics.'
        };
      }

      if (errName === 'NotAllowedError' || errName === 'AbortError' || errMsg.toLowerCase().includes('cancel')) {
        return { error: 'Passkey registration was cancelled.' };
      }

      console.warn('[WEBAUTHN] Register note:', errMsg);
      return { error: errMsg || 'Passkey registration cancelled or unsupported.' };
    }
  },

  /**
   * Passkeys: Login with Passkey
   */
  async loginWithPasskey(email?: string): Promise<{
    success?: boolean;
    user?: AuthUser;
    sessionToken?: string;
    error?: string;
  }> {
    const availability = checkPasskeyAvailability();
    if (!availability.allowed) {
      return {
        error: availability.reason || 'Passkeys are disabled inside this embedded preview frame by browser Permissions Policy. Please sign in with Email & Password.'
      };
    }

    try {
      // 1. Get authentication options
      const optRes = await fetch('/api/auth/webauthn/login/options', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ email })
      });
      if (!optRes.ok) throw new Error('Could not get passkey authentication options');
      const { options, challengeKey } = await optRes.json();

      // 2. Trigger browser WebAuthn
      const authResp = await startAuthentication({ optionsJSON: options });

      // 3. Verify
      const verifyRes = await fetch('/api/auth/webauthn/login/verify', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ response: authResp, challengeKey })
      });

      const data = await verifyRes.json();
      if (!verifyRes.ok) return { error: data.error || 'Passkey sign-in failed.' };

      if (data.sessionToken) {
        this.setSessionToken(data.sessionToken);
      }

      return { success: true, user: data.user, sessionToken: data.sessionToken };
    } catch (err: any) {
      const errName = err?.name || '';
      const errMsg = err?.message || String(err || '');
      const isPolicyRestriction =
        errName === 'NotAllowedError' &&
        (errMsg.includes('publickey-credentials') ||
         errMsg.includes('Permissions Policy') ||
         errMsg.includes('cross-origin child frames') ||
         errMsg.includes('feature is not enabled in this document'));

      if (isPolicyRestriction) {
        console.info('[WEBAUTHN] Passkey login restricted by iframe Permissions Policy. Use email/password.');
        return {
          error: 'Passkeys are restricted inside embedded preview frames by browser Permissions Policy. Please sign in with Email & Password.'
        };
      }

      if (errName === 'NotAllowedError' || errName === 'AbortError' || errMsg.toLowerCase().includes('cancel')) {
        return { error: 'Biometric passkey sign-in was cancelled.' };
      }

      console.warn('[WEBAUTHN] Login note:', errMsg);
      return { error: errMsg || 'Passkey authentication cancelled or unsupported.' };
    }
  },

  /**
   * List user's registered passkeys
   */
  async getPasskeys(): Promise<{ id: string; deviceName: string; createdAt: string }[]> {
    try {
      const res = await fetch('/api/auth/webauthn/passkeys', {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.passkeys || [];
    } catch {
      return [];
    }
  },

  /**
   * Remove passkey
   */
  async deletePasskey(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/auth/webauthn/passkeys/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      return res.ok;
    } catch {
      return false;
    }
  }
};

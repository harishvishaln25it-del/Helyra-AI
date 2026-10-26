/**
 * HELYRA Enterprise Account Security & Privacy Center
 * 
 * Features:
 * - Email verification status
 * - Password last changed & Change Password modal (Argon2id)
 * - Two-Factor Authentication (TOTP RFC 6238 + 8 recovery codes)
 * - Passkeys / WebAuthn (FIDO2 / Biometrics)
 * - Active Sessions management (device list, IP, last active, revocation)
 * - Security Audit Trail (login events, password changes)
 * - Account Deletion with password confirmation & complete data purge
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  KeyRound,
  Smartphone,
  Fingerprint,
  Laptop,
  Globe,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  LogOut,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowLeft,
  Lock,
  Clock,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { authService, UserSessionInfo, SecurityEventLog } from '../services/authService';
import { useHealth } from '../context/HealthContext';

interface SecuritySettingsScreenProps {
  onBack: () => void;
}

export const SecuritySettingsScreen: React.FC<SecuritySettingsScreenProps> = ({ onBack }) => {
  const { user, securityStatus, refreshSecurity, logout } = useHealth();

  // State
  const [sessions, setSessions] = useState<UserSessionInfo[]>([]);
  const [passkeys, setPasskeys] = useState<{ id: string; deviceName: string; createdAt: string }[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityEventLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [passkeyStatus] = useState(() => authService.checkPasskeyAvailability());

  // Modals
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [show2FASetupModal, setShow2FASetupModal] = useState(false);
  const [show2FADisableModal, setShow2FADisableModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Change Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // 2FA Setup
  const [totpSecret, setTotpSecret] = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');

  // Delete Account
  const [deletePassword, setDeletePassword] = useState('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      const [sessList, pkList, logList] = await Promise.all([
        authService.getSessions(),
        authService.getPasskeys(),
        authService.getSecurityLogs()
      ]);
      setSessions(sessList);
      setPasskeys(pkList);
      setSecurityLogs(logList);
    } catch (err) {
      console.warn('Could not load security data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityData();
  }, []);

  // --- Handlers ---

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 12) {
      showToast('New password must be at least 12 characters.', 'error');
      return;
    }

    setLoading(true);
    const res = await authService.changePassword(currentPassword, newPassword);
    setLoading(false);

    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('Password changed successfully. Other sessions invalidated.', 'success');
      setShowChangePasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      refreshSecurity();
      loadSecurityData();
    }
  };

  const handleStart2FASetup = async () => {
    setLoading(true);
    const res = await authService.setup2FA();
    setLoading(false);

    if (res.error) {
      showToast(res.error, 'error');
    } else {
      setTotpSecret(res.secret);
      setOtpauthUrl(res.otpauthUrl);
      setRecoveryCodes(res.recoveryCodes);
      setShow2FASetupModal(true);
    }
  };

  const handleConfirm2FAEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.trim().length !== 6) {
      showToast('Please enter a valid 6-digit code.', 'error');
      return;
    }

    setLoading(true);
    const res = await authService.enable2FA(verificationCode, totpSecret, recoveryCodes);
    setLoading(false);

    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('Two-Factor Authentication is now enabled!', 'success');
      setShow2FASetupModal(false);
      setVerificationCode('');
      refreshSecurity();
      loadSecurityData();
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await authService.disable2FA(disablePassword);
    setLoading(false);

    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('Two-Factor Authentication disabled.', 'success');
      setShow2FADisableModal(false);
      setDisablePassword('');
      refreshSecurity();
      loadSecurityData();
    }
  };

  const handleRegisterPasskey = async () => {
    if (!passkeyStatus.allowed) {
      showToast(passkeyStatus.reason || 'Passkey registration is restricted inside embedded preview frames by browser Permissions Policy.', 'error');
      return;
    }

    setLoading(true);
    const res = await authService.registerPasskey('Biometric / Hardware Key');
    setLoading(false);

    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('Passkey registered successfully!', 'success');
      refreshSecurity();
      loadSecurityData();
    }
  };

  const handleDeletePasskey = async (id: string) => {
    const ok = await authService.deletePasskey(id);
    if (ok) {
      showToast('Passkey removed.', 'success');
      refreshSecurity();
      loadSecurityData();
    } else {
      showToast('Could not remove passkey.', 'error');
    }
  };

  const handleRevokeSession = async (id: string) => {
    const ok = await authService.revokeSession(id);
    if (ok) {
      showToast('Session revoked.', 'success');
      loadSecurityData();
    } else {
      showToast('Could not revoke session.', 'error');
    }
  };

  const handleLogoutAll = async () => {
    if (confirm('Are you sure you want to sign out from all devices?')) {
      await authService.logoutAll();
      logout();
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletePassword) {
      showToast('Password is required.', 'error');
      return;
    }

    setLoading(true);
    const res = await authService.deleteAccount(deletePassword);
    setLoading(false);

    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('Account permanently deleted.', 'success');
      logout();
    }
  };

  return (
    <div className="space-y-6 pb-28 animate-fade-in max-w-3xl mx-auto px-4 pt-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 text-sm font-semibold border backdrop-blur-xl animate-fade-in ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
              : 'bg-rose-950/90 text-rose-200 border-rose-500/40'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-bold">Back</span>
        </button>

        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
            Argon2id Encrypted
          </span>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-teal-500/20 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-extrabold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Enterprise Account Protection</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Security & Privacy Center</h1>
            <p className="text-sm text-slate-300 mt-1 max-w-lg">
              Manage multi-factor authentication, biometric passkeys, active sessions, and cryptographic data protection.
            </p>
          </div>

          <button
            onClick={loadSecurityData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="Refresh Security Status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        </div>

        {/* Security Posture Summary Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800">
          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Password</span>
            <span className="text-xs font-mono font-bold text-teal-400 mt-0.5 block">Argon2id Active</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">2FA Status</span>
            <span
              className={`text-xs font-mono font-bold mt-0.5 block ${
                securityStatus?.twoFactorEnabled ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {securityStatus?.twoFactorEnabled ? 'TOTP Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Passkeys</span>
            <span className="text-xs font-mono font-bold text-cyan-400 mt-0.5 block">
              {passkeys.length} Registered
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Sessions</span>
            <span className="text-xs font-mono font-bold text-purple-400 mt-0.5 block">
              {sessions.length} Active
            </span>
          </div>
        </div>
      </div>

      {/* 1. Password & Authentication Section */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">Password & Credentials</h2>
            <p className="text-xs text-slate-400">
              Protected with server-side Argon2id (memory: 64MB, parallelism: 4)
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl">
          <div>
            <span className="text-xs font-bold text-slate-200 block">Current Password</span>
            <span className="text-[11px] text-slate-400 font-mono">
              Last modified: {securityStatus?.passwordChangedAt ? new Date(securityStatus.passwordChangedAt).toLocaleDateString() : 'Active'}
            </span>
          </div>

          <button
            onClick={() => setShowChangePasswordModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 hover:bg-teal-500/30 text-xs font-black transition"
          >
            Change Password
          </button>
        </div>
      </div>

      {/* 2. Two-Factor Authentication (TOTP) Section */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Two-Factor Authentication (2FA)</h2>
              <p className="text-xs text-slate-400">
                Requires an authenticator app (Google Authenticator, Apple Keychain, Authy)
              </p>
            </div>
          </div>

          {securityStatus?.twoFactorEnabled ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ACTIVE</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>OFF</span>
            </span>
          )}
        </div>

        <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-200 block">
              {securityStatus?.twoFactorEnabled ? 'RFC 6238 TOTP Active' : 'Enhance Account Security'}
            </span>
            <span className="text-[11px] text-slate-400 block">
              {securityStatus?.twoFactorEnabled
                ? `${securityStatus.remainingRecoveryCodes} single-use backup recovery codes remaining.`
                : 'Protects your health documents & metrics against compromised passwords.'}
            </span>
          </div>

          {securityStatus?.twoFactorEnabled ? (
            <button
              onClick={() => setShow2FADisableModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 text-xs font-black transition"
            >
              Disable 2FA
            </button>
          ) : (
            <button
              onClick={handleStart2FASetup}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 text-xs font-black transition"
            >
              Enable 2FA
            </button>
          )}
        </div>
      </div>

      {/* 3. Biometric Passkeys / WebAuthn Section */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Biometric Passkeys & FIDO2</h2>
              <p className="text-xs text-slate-400">
                Log in securely using Face ID, Touch ID, or hardware security keys
              </p>
            </div>
          </div>

          <button
            onClick={handleRegisterPasskey}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 text-xs font-black transition flex items-center space-x-1.5"
          >
            <span>+ Add Passkey</span>
          </button>
        </div>

        {!passkeyStatus.allowed && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center space-x-2.5 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              Embedded iframe preview: Passkey registration is restricted by browser Permissions Policy. Please test in top-level window or use TOTP 2FA.
            </span>
          </div>
        )}

        {passkeys.length === 0 ? (
          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl text-center">
            <Fingerprint className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-300">No passkeys registered yet</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Passkeys replace passwords with device-level public-key cryptography resistant to phishing.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {passkeys.map(pk => (
              <div
                key={pk.id}
                className="flex items-center justify-between p-3 bg-slate-950/70 border border-slate-800 rounded-2xl"
              >
                <div className="flex items-center space-x-3">
                  <Fingerprint className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">{pk.deviceName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Added: {new Date(pk.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeletePasskey(pk.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                  title="Remove Passkey"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Active Sessions Section */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Active Sessions</h2>
              <p className="text-xs text-slate-400">
                Devices currently authenticated with HttpOnly session cookies
              </p>
            </div>
          </div>

          <button
            onClick={handleLogoutAll}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-rose-300 hover:bg-rose-950/40 hover:border-rose-500/30 text-xs font-black transition flex items-center space-x-1.5"
          >
            <LogOut className="w-3 h-3" />
            <span>Sign Out Everywhere</span>
          </button>
        </div>

        <div className="space-y-2">
          {sessions.map(s => (
            <div
              key={s.id}
              className={`flex items-center justify-between p-3 rounded-2xl border ${
                s.isCurrent
                  ? 'bg-purple-950/20 border-purple-500/40'
                  : 'bg-slate-950/70 border-slate-800'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    s.isCurrent ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">{s.deviceName}</span>
                    {s.isCurrent && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-purple-500/30 text-purple-200 border border-purple-400/40">
                        This Device
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    IP: {s.ip} • Last active: {new Date(s.lastActiveAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {!s.isCurrent && (
                <button
                  onClick={() => handleRevokeSession(s.id)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 text-xs font-bold transition"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 5. Security Audit Log Section */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">Recent Security Activity</h2>
            <p className="text-xs text-slate-400">
              Immutable audit trail of authentication and credential events
            </p>
          </div>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {securityLogs.length === 0 ? (
            <p className="text-xs text-slate-500 p-3 text-center">No recent security events logged.</p>
          ) : (
            securityLogs.map(log => (
              <div
                key={log.id}
                className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-200">{log.event}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({log.ip})</span>
                  </div>
                  {log.details && <p className="text-[11px] text-slate-400">{log.details}</p>}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 6. Danger Zone / Account Deletion */}
      <div className="bg-rose-950/20 border border-rose-500/30 rounded-3xl p-5 space-y-3 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-rose-200">Danger Zone</h2>
            <p className="text-xs text-rose-300/80">
              Permanent account termination and data purge
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-300 max-w-md">
            Permanently erase all fitness tracks, medical documents, medication schedules, and security credentials.
          </p>

          <button
            onClick={() => setShowDeleteAccountModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600/30 border border-rose-500/50 text-rose-200 hover:bg-rose-600/50 text-xs font-black transition"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: Change Password                                                   */}
      {/* ========================================================================= */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Change Password</h3>
              <button
                onClick={() => setShowChangePasswordModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  New Password (Min 12 Characters)
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    minLength={12}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={e => setConfirmNewPassword(e.target.value)}
                  required
                  minLength={12}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-black shadow-lg hover:brightness-110 transition"
                >
                  {loading ? 'Hashing...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: 2FA Setup                                                          */}
      {/* ========================================================================= */}
      {show2FASetupModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Enable Two-Factor Authentication</h3>
              <button onClick={() => setShow2FASetupModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              1. Add this key to your authenticator app (Google Authenticator, Microsoft, 1Password, Apple Keychain):
            </p>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-teal-400 tracking-wider break-all select-all">
                {totpSecret}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(totpSecret);
                  showToast('Secret key copied!', 'success');
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg ml-2 shrink-0"
                title="Copy Secret"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              2. Save your <strong>8 single-use recovery codes</strong> in case you lose access to your phone:
            </p>

            <div className="grid grid-cols-2 gap-1.5 p-3 bg-slate-950 border border-slate-800 rounded-2xl">
              {recoveryCodes.map((code, idx) => (
                <span key={idx} className="font-mono text-xs font-bold text-slate-300">
                  {code}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(recoveryCodes.join('\n'));
                showToast('Recovery codes copied to clipboard!', 'success');
              }}
              className="w-full py-1.5 text-xs font-bold text-slate-400 bg-slate-800/80 rounded-xl hover:text-white transition flex items-center justify-center space-x-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy All Recovery Codes</span>
            </button>

            <form onSubmit={handleConfirm2FAEnable} className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  3. Enter 6-Digit Code from Authenticator
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-center font-mono text-lg font-black tracking-widest text-teal-300 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShow2FASetupModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-teal-500 text-white text-xs font-black shadow-lg hover:brightness-110 transition"
                >
                  {loading ? 'Verifying...' : 'Activate 2FA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: 2FA Disable                                                        */}
      {/* ========================================================================= */}
      {show2FADisableModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <h3 className="text-lg font-black text-white">Disable Two-Factor Authentication</h3>
            <p className="text-xs text-slate-300">
              Please enter your current account password to confirm disabling two-factor protection:
            </p>

            <form onSubmit={handleDisable2FA} className="space-y-4">
              <input
                type="password"
                value={disablePassword}
                onChange={e => setDisablePassword(e.target.value)}
                placeholder="Current account password"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
              />

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShow2FADisableModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-black hover:bg-rose-500 transition"
                >
                  {loading ? 'Verifying...' : 'Confirm Disable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Delete Account                                                     */}
      {/* ========================================================================= */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-black text-white">Permanently Delete Account?</h3>
            </div>

            <p className="text-xs text-rose-200/80">
              This action cannot be undone. All step history, GPS workouts, medication records, and medical documents will be permanently purged.
            </p>

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Confirm Password to Authorize Deletion
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteAccountModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-black hover:bg-rose-500 transition"
                >
                  {loading ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

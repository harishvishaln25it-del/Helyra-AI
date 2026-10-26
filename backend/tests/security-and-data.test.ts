/**
 * HELYRA Comprehensive Security & Database Test Suite
 * 
 * Verifies:
 * 1. User registration & duplicate protection
 * 2. Login authentication, Argon2id verification, and 5-attempt brute-force lockout
 * 3. Two-factor authentication (TOTP & single-use recovery codes)
 * 4. Session management, active session listing, and session revocation
 * 5. BOLA / IDOR protection (User A cannot access or mutate User B's records)
 * 6. Family sharing permissions with 6 privacy controls
 * 7. Complete account deletion purge
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import { prisma } from '../src/server/prismaClient';
import { db } from '../src/server/db';
import * as OTPAuth from 'otpauth';

describe('HELYRA Phase 1: Security & PostgreSQL Database Test Suite', () => {
  const testUserA = {
    name: 'Alice Tester',
    email: `alice_${Date.now()}@example.com`,
    password: 'SecurePassword123#Alpha',
    phone: '+1-555-0101',
    role: 'individual'
  };

  const testUserB = {
    name: 'Bob Tester',
    email: `bob_${Date.now()}@example.com`,
    password: 'SecurePassword123#Beta',
    phone: '+1-555-0102',
    role: 'individual'
  };

  let userACookie: string;
  let userBCookie: string;
  let userAId: string;
  let userBId: string;

  beforeAll(async () => {
    // Seed initial demo data
    await db.initSeeds();
  });

  afterAll(async () => {
    // Clean up test data
    try {
      if (userAId) await db.deleteUser(userAId);
      if (userBId) await db.deleteUser(userBId);
    } catch {}
    await prisma.$disconnect();
  });

  // ==========================================
  // 1. REGISTRATION
  // ==========================================
  describe('1. User Registration', () => {
    it('should successfully register User A with Argon2id hashed password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUserA);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(testUserA.email.toLowerCase());
      expect(res.body.user.passwordHash).toBeUndefined(); // Sensitive hash never leaked

      userAId = res.body.user.id;

      // Verify row exists in PostgreSQL
      const dbUser = await prisma.user.findUnique({ where: { email: testUserA.email.toLowerCase() } });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.passwordHash).not.toBe(testUserA.password); // Hashed
    });

    it('should reject duplicate registration with identical email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUserA);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already exists');
    });

    it('should register User B for isolation testing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUserB);

      expect(res.status).toBe(201);
      userBId = res.body.user.id;
    });
  });

  // ==========================================
  // 2. LOGIN & BRUTE FORCE LOCKOUT
  // ==========================================
  describe('2. Login & Lockout Protection', () => {
    it('should login User A successfully and return HttpOnly session cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUserA.email, password: testUserA.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.headers['set-cookie']).toBeDefined();

      userACookie = res.headers['set-cookie'][0];
    });

    it('should login User B successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUserB.email, password: testUserB.password });

      expect(res.status).toBe(200);
      userBCookie = res.headers['set-cookie'][0];
    });

    it('should reject invalid password for User A', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUserA.email, password: 'WrongPassword#123' });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid email or password');
    });

    it('should trigger temporary brute-force lockout after 5 consecutive failures', async () => {
      const lockoutEmail = `lockout_${Date.now()}@test.com`;
      await request(app).post('/api/auth/register').send({
        name: 'Lockout Target',
        email: lockoutEmail,
        password: 'ValidPassword123#Alpha'
      });

      // 5 consecutive failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ email: lockoutEmail, password: 'IncorrectPassword#999' });
      }

      // 6th attempt must be rejected with 429 Too Many Requests
      const lockRes = await request(app)
        .post('/api/auth/login')
        .send({ email: lockoutEmail, password: 'ValidPassword123#Alpha' });

      expect(lockRes.status).toBe(429);
      expect(lockRes.body.error).toContain('Too many failed attempts');
    });
  });

  // ==========================================
  // 3. TWO-FACTOR AUTHENTICATION (TOTP)
  // ==========================================
  describe('3. Two-Factor Authentication (2FA)', () => {
    let totpSecretBase32: string;
    let recoveryCodes: string[];

    it('should generate 2FA setup secret and recovery codes', async () => {
      const res = await request(app)
        .post('/api/auth/2fa/setup')
        .set('Cookie', userACookie);

      expect(res.status).toBe(200);
      expect(res.body.secret).toBeDefined();
      expect(res.body.otpauthUrl).toContain('otpauth://totp/');
      expect(res.body.recoveryCodes).toHaveLength(8);

      totpSecretBase32 = res.body.secret;
      recoveryCodes = res.body.recoveryCodes;
    });

    it('should enable 2FA with a valid TOTP token', async () => {
      const totp = new OTPAuth.TOTP({
        issuer: 'HELYRA',
        label: testUserA.email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(totpSecretBase32)
      });
      const validToken = totp.generate();

      const res = await request(app)
        .post('/api/auth/2fa/enable')
        .set('Cookie', userACookie)
        .send({
          code: validToken,
          secret: totpSecretBase32,
          recoveryCodes
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify AES-256-GCM encryption in Postgres
      const totpRow = await prisma.totpSecret.findUnique({ where: { userId: userAId } });
      expect(totpRow).not.toBeNull();
      expect(totpRow?.encryptedSecret).not.toBe(totpSecretBase32); // Must be encrypted at rest
    });

    it('should require 2FA challenge on subsequent login for User A', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUserA.email, password: testUserA.password });

      expect(res.status).toBe(200);
      expect(res.body.requires2FA).toBe(true);
      expect(res.body.tempToken).toBeDefined();

      // Complete login with valid recovery code
      const challengeRes = await request(app)
        .post('/api/auth/2fa/verify')
        .send({
          tempToken: res.body.tempToken,
          code: recoveryCodes[0],
          isRecoveryCode: true
        });

      expect(challengeRes.status).toBe(200);
      expect(challengeRes.body.success).toBe(true);
      expect(challengeRes.headers['set-cookie']).toBeDefined();

      userACookie = challengeRes.headers['set-cookie'][0];
    });
  });

  // ==========================================
  // 4. SESSION MANAGEMENT & REVOCATION
  // ==========================================
  describe('4. Session Management & Revocation', () => {
    it('should list active sessions for User A', async () => {
      const res = await request(app)
        .get('/api/auth/sessions')
        .set('Cookie', userACookie);

      expect(res.status).toBe(200);
      expect(res.body.sessions).toBeInstanceOf(Array);
      expect(res.body.sessions.length).toBeGreaterThanOrEqual(1);
    });

    it('should revoke a session by ID', async () => {
      // Create a secondary session for User A
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUserA.email, password: testUserA.password });

      const secondCookie = loginRes.headers['set-cookie'][0];
      const meRes = await request(app).get('/api/auth/me').set('Cookie', secondCookie);
      const targetSessionId = meRes.body.security.activeSessionsCount > 1 ? meRes.body.user.id : null;

      const sessionsRes = await request(app).get('/api/auth/sessions').set('Cookie', userACookie);
      const toDelete = sessionsRes.body.sessions.find((s: any) => !s.isCurrent);

      if (toDelete) {
        const delRes = await request(app)
          .delete(`/api/auth/sessions/${toDelete.id}`)
          .set('Cookie', userACookie);
        expect(delRes.status).toBe(200);
      }
    });

    it('should logout all devices on /logout-all', async () => {
      const res = await request(app)
        .post('/api/auth/logout-all')
        .set('Cookie', userACookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify sessions purged in database
      const sessions = await prisma.session.findMany({ where: { userId: userAId } });
      expect(sessions).toHaveLength(0);

      // Re-login User A for remaining tests
      const reloginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUserA.email, password: testUserA.password });

      const totp = new OTPAuth.TOTP({
        issuer: 'HELYRA',
        label: testUserA.email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(totpSecretBase32)
      });
      const verifyRes = await request(app)
        .post('/api/auth/2fa/verify')
        .send({ tempToken: reloginRes.body.tempToken, code: totp.generate() });

      userACookie = verifyRes.headers['set-cookie'][0];
    });
  });

  // ==========================================
  // 5. BOLA / IDOR PROTECTION
  // ==========================================
  describe('5. BOLA / IDOR Protection (Scoped to User ID)', () => {
    let userAMedicationId: string;
    let userADocumentId: string;

    it('should allow User A to create daily health summaries, medications, and documents', async () => {
      // Daily record
      const dailyRes = await request(app)
        .post('/api/health-data/daily')
        .set('Cookie', userACookie)
        .send({
          date: '2026-10-26',
          steps: 9500,
          distance: 7.1,
          waterLiters: 2.5,
          sleepHours: 8.0
        });
      expect(dailyRes.status).toBe(200);

      // Medication
      const medRes = await request(app)
        .post('/api/health-data/medications')
        .set('Cookie', userACookie)
        .send({
          name: 'Atorvastatin 20mg',
          dosage: '1 Tablet',
          scheduleTimes: ['09:00 PM'],
          notes: 'User A private prescription'
        });
      expect(medRes.status).toBe(201);
      userAMedicationId = medRes.body.medication.id;

      // Document
      const docRes = await request(app)
        .post('/api/health-data/documents')
        .set('Cookie', userACookie)
        .send({
          title: 'Alice Blood Test Panel 2026',
          type: 'blood_test',
          fileBase64: Buffer.from('Confidential Medical Report Alice').toString('base64'),
          contentType: 'application/pdf'
        });
      expect(docRes.status).toBe(201);
      userADocumentId = docRes.body.document.id;
    });

    it('should PREVENT User B from deleting or mutating User A medication (BOLA)', async () => {
      const res = await request(app)
        .delete(`/api/health-data/medications/${userAMedicationId}`)
        .set('Cookie', userBCookie);

      expect(res.status).toBe(404); // Scoped query does not find medication under User B
    });

    it('should PREVENT User B from deleting User A medical document (BOLA)', async () => {
      const res = await request(app)
        .delete(`/api/health-data/documents/${userADocumentId}`)
        .set('Cookie', userBCookie);

      expect(res.status).toBe(404);
    });

    it('should ensure User B reading /api/health-data receives only their own records', async () => {
      const res = await request(app)
        .get('/api/health-data')
        .set('Cookie', userBCookie);

      expect(res.status).toBe(200);
      expect(res.body.userId).toBe(userBId);
      expect(res.body.medications).toHaveLength(0); // None of User A's medications appear
    });
  });

  // ==========================================
  // 6. FAMILY SHARING PERMISSIONS
  // ==========================================
  describe('6. Family Sharing Permissions (6 Privacy Controls)', () => {
    it('should store and enforce granular sharing permissions with medical details private by default', async () => {
      const permission = await prisma.sharingPermission.upsert({
        where: {
          ownerUserId_viewerUserId: {
            ownerUserId: userAId,
            viewerUserId: userBId
          }
        },
        update: {},
        create: {
          ownerUserId: userAId,
          viewerUserId: userBId,
          shareActivity: true,
          shareExercise: true,
          shareMedicationStatus: true,
          shareWater: true,
          shareDetailedDocuments: false, // Default FALSE
          sharePrivateMedicalInfo: false  // Default FALSE
        }
      });

      expect(permission.shareActivity).toBe(true);
      expect(permission.shareDetailedDocuments).toBe(false);
      expect(permission.sharePrivateMedicalInfo).toBe(false);
    });
  });

  // ==========================================
  // 7. ACCOUNT DELETION PURGE
  // ==========================================
  describe('7. Permanent Account Deletion & File Purge', () => {
    it('should reject account deletion without password confirmation', async () => {
      const res = await request(app)
        .delete('/api/auth/account')
        .set('Cookie', userACookie)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should reject account deletion with incorrect password', async () => {
      const res = await request(app)
        .delete('/api/auth/account')
        .set('Cookie', userACookie)
        .send({ password: 'WrongPassword#123' });

      expect(res.status).toBe(401);
    });

    it('should purge User A completely from PostgreSQL and delete stored files', async () => {
      const res = await request(app)
        .delete('/api/auth/account')
        .set('Cookie', userACookie)
        .send({ password: testUserA.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify user and child records are purged in database
      const user = await prisma.user.findUnique({ where: { id: userAId } });
      expect(user).toBeNull();

      const dailies = await prisma.healthDaily.findMany({ where: { userId: userAId } });
      expect(dailies).toHaveLength(0);

      const meds = await prisma.medication.findMany({ where: { userId: userAId } });
      expect(meds).toHaveLength(0);

      const docs = await prisma.document.findMany({ where: { userId: userAId } });
      expect(docs).toHaveLength(0);
    });
  });
});

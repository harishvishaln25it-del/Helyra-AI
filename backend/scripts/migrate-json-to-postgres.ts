/**
 * One-Time Idempotent Migration Script: JSON -> PostgreSQL (Neon / Prisma)
 * 
 * Imports users, sessions, passkeys, security logs, and health records from
 * backend/.data/helyra_security.json into PostgreSQL.
 * 
 * Usage:
 *   npx tsx scripts/migrate-json-to-postgres.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../src/server/prismaClient';
import { AuditEventType } from '@prisma/client';

async function migrate() {
  console.log('====================================================');
  console.log('🚀 HELYRA JSON -> PostgreSQL Data Migration');
  console.log('====================================================');

  const jsonFilePath = path.join(process.cwd(), '.data', 'helyra_security.json');

  if (!fs.existsSync(jsonFilePath)) {
    console.log(`ℹ️ No legacy file found at ${jsonFilePath}. Nothing to migrate.`);
    return;
  }

  const raw = fs.readFileSync(jsonFilePath, 'utf8');
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error('❌ Failed to parse legacy JSON file:', err);
    process.exit(1);
  }

  const summary = {
    usersMigrated: 0,
    sessionsMigrated: 0,
    passkeysMigrated: 0,
    auditLogsMigrated: 0,
    dailyRecordsMigrated: 0,
    medicationsMigrated: 0,
    documentsMigrated: 0
  };

  // 1. Migrate Users
  const userMap = new Set<string>();
  if (Array.isArray(data.users)) {
    console.log(`\nImporting ${data.users.length} user records...`);
    for (const u of data.users) {
      const email = u.email ? String(u.email).trim().toLowerCase() : `user_${u.id}@placeholder.com`;
      const createdUser = await prisma.user.upsert({
        where: { email },
        update: {
          name: u.name || 'User',
          passwordHash: u.passwordHash,
          phone: u.phone ?? null,
          role: u.role || 'family_admin',
          emailVerifiedAt: u.emailVerified ? (u.createdAt ? new Date(u.createdAt) : new Date()) : null,
          twoFactorEnabled: Boolean(u.twoFactorEnabled),
          failedLoginAttempts: u.failedLoginAttempts || 0,
          passwordChangedAt: u.passwordChangedAt ? new Date(u.passwordChangedAt) : new Date()
        },
        create: {
          id: u.id,
          email,
          name: u.name || 'User',
          passwordHash: u.passwordHash,
          phone: u.phone ?? null,
          role: u.role || 'family_admin',
          emailVerifiedAt: u.emailVerified ? (u.createdAt ? new Date(u.createdAt) : new Date()) : null,
          twoFactorEnabled: Boolean(u.twoFactorEnabled),
          failedLoginAttempts: u.failedLoginAttempts || 0,
          passwordChangedAt: u.passwordChangedAt ? new Date(u.passwordChangedAt) : new Date(),
          createdAt: u.createdAt ? new Date(u.createdAt) : new Date()
        }
      });
      userMap.add(createdUser.id);
      summary.usersMigrated++;

      if (u.twoFactorSecretEncrypted) {
        await prisma.totpSecret.upsert({
          where: { userId: createdUser.id },
          update: {
            encryptedSecret: u.twoFactorSecretEncrypted,
            backupCodeHashes: u.recoveryCodesHashed || []
          },
          create: {
            userId: createdUser.id,
            encryptedSecret: u.twoFactorSecretEncrypted,
            backupCodeHashes: u.recoveryCodesHashed || []
          }
        });
      }
    }
  }

  // 2. Migrate Sessions (only valid user sessions)
  if (Array.isArray(data.sessions)) {
    console.log(`\nImporting ${data.sessions.length} session records...`);
    for (const s of data.sessions) {
      if (!userMap.has(s.userId)) continue;
      await prisma.session.upsert({
        where: { tokenHash: s.tokenHash },
        update: {
          expiresAt: new Date(s.expiresAt),
          lastSeenAt: s.lastActiveAt ? new Date(s.lastActiveAt) : new Date()
        },
        create: {
          id: s.id,
          userId: s.userId,
          tokenHash: s.tokenHash,
          ip: s.ip || '127.0.0.1',
          userAgent: s.userAgent || 'Browser Session',
          deviceInfo: s.deviceName || 'Browser Session',
          expiresAt: new Date(s.expiresAt),
          lastSeenAt: s.lastActiveAt ? new Date(s.lastActiveAt) : new Date(),
          createdAt: s.createdAt ? new Date(s.createdAt) : new Date()
        }
      });
      summary.sessionsMigrated++;
    }
  }

  // 3. Migrate Passkeys
  if (Array.isArray(data.passkeys)) {
    console.log(`\nImporting ${data.passkeys.length} passkeys...`);
    for (const p of data.passkeys) {
      if (!userMap.has(p.userId)) continue;
      await prisma.passkey.upsert({
        where: { credentialId: p.credentialId },
        update: {
          counter: BigInt(p.counter || 0),
          deviceName: p.deviceName || 'Passkey Device'
        },
        create: {
          id: p.id,
          userId: p.userId,
          credentialId: p.credentialId,
          publicKey: p.publicKey,
          counter: BigInt(p.counter || 0),
          deviceName: p.deviceName || 'Passkey Device',
          transports: p.transports || [],
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date()
        }
      });
      summary.passkeysMigrated++;
    }
  }

  // 4. Migrate Security Logs
  if (Array.isArray(data.securityLogs)) {
    console.log(`\nImporting ${data.securityLogs.length} audit logs...`);
    for (const l of data.securityLogs) {
      const validEnum = (AuditEventType as any)[l.event]
        ? (l.event as AuditEventType)
        : AuditEventType.LOGIN_SUCCESS;

      await prisma.auditLog.create({
        data: {
          userId: userMap.has(l.userId) ? l.userId : null,
          event: validEnum,
          ip: l.ip || null,
          userAgent: l.userAgent || null,
          metadata: {
            details: l.details || null,
            userEmail: l.userEmail || null
          },
          createdAt: l.timestamp ? new Date(l.timestamp) : new Date()
        }
      });
      summary.auditLogsMigrated++;
    }
  }

  // 5. Migrate Health Data
  if (data.healthData && typeof data.healthData === 'object') {
    console.log(`\nImporting health data records...`);
    for (const [userId, healthRecord] of Object.entries<any>(data.healthData)) {
      if (!userMap.has(userId)) continue;

      // Migrate daily records
      if (healthRecord.dailyRecords && typeof healthRecord.dailyRecords === 'object') {
        for (const [date, rec] of Object.entries<any>(healthRecord.dailyRecords)) {
          await prisma.healthDaily.upsert({
            where: { userId_date: { userId, date } },
            update: {
              steps: rec.steps || 0,
              distance: rec.distance || 0,
              activeMinutes: rec.activeMinutes || 0,
              waterLiters: rec.waterMl ? rec.waterMl / 1000 : 0,
              sleepHours: rec.sleepMinutes ? rec.sleepMinutes / 60 : 0
            },
            create: {
              userId,
              date,
              steps: rec.steps || 0,
              distance: rec.distance || 0,
              activeMinutes: rec.activeMinutes || 0,
              waterLiters: rec.waterMl ? rec.waterMl / 1000 : 0,
              sleepHours: rec.sleepMinutes ? rec.sleepMinutes / 60 : 0
            }
          });
          summary.dailyRecordsMigrated++;
        }
      }

      // Migrate medications
      if (Array.isArray(healthRecord.medications)) {
        for (const m of healthRecord.medications) {
          await prisma.medication.create({
            data: {
              userId,
              name: m.name || 'Medication',
              dosage: m.dose || '1 tablet',
              scheduleTimes: [m.scheduledTime || '08:00 AM'],
              notes: m.notes || null,
              active: m.active !== false
            }
          });
          summary.medicationsMigrated++;
        }
      }

      // Migrate documents
      if (Array.isArray(healthRecord.documents)) {
        for (const d of healthRecord.documents) {
          await prisma.document.create({
            data: {
              userId,
              title: d.title || 'Medical Document',
              type: d.type || 'prescription',
              storageKey: d.storageKey || `migrated_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              extractedJson: d.extractedJson ?? null
            }
          });
          summary.documentsMigrated++;
        }
      }
    }
  }

  console.log('\n====================================================');
  console.log('✅ Migration Summary:');
  console.log(`- Users:         ${summary.usersMigrated}`);
  console.log(`- Sessions:      ${summary.sessionsMigrated}`);
  console.log(`- Passkeys:      ${summary.passkeysMigrated}`);
  console.log(`- Audit Logs:    ${summary.auditLogsMigrated}`);
  console.log(`- Daily Records: ${summary.dailyRecordsMigrated}`);
  console.log(`- Medications:   ${summary.medicationsMigrated}`);
  console.log(`- Documents:     ${summary.documentsMigrated}`);
  console.log('====================================================');
}

migrate()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

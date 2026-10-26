/**
 * HELYRA Database Seeder (Development Only)
 * 
 * Pre-populates the database with verified demo credentials and sample health records.
 * 
 * Usage:
 *   npx tsx prisma/seed.ts
 */

import { prisma } from '../src/server/prismaClient';
import { hashPassword } from '../src/server/crypto';

async function seed() {
  console.log('[Seed] Seeding development database...');

  const demoEmail = 'harish.health@gmail.com';
  const defaultPassword = 'HelyraSecurity#2026!';
  const hash = await hashPassword(defaultPassword);

  const demoUser = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      id: 'usr_harish_01',
      name: 'Harish',
      email: demoEmail,
      passwordHash: hash,
      phone: '+1-555-0199',
      role: 'family_admin',
      language: 'en',
      emailVerifiedAt: new Date(),
      twoFactorEnabled: false,
      familyCode: 'HL-849201',
      adaptivePreferences: {
        preferredInteractionType: 'both',
        responseLength: 'short',
        voiceReminderEnabled: true,
        voiceTone: 'gentle',
        fontSize: 'standard',
        highContrastMode: false,
        familyNudgeAllowed: true,
        language: 'en'
      }
    }
  });

  // Seed sample health dailies
  const today = new Date().toISOString().split('T')[0];
  await prisma.healthDaily.upsert({
    where: { userId_date: { userId: demoUser.id, date: today } },
    update: {},
    create: {
      userId: demoUser.id,
      date: today,
      steps: 8420,
      distance: 6.2,
      activeMinutes: 45,
      waterLiters: 2.2,
      sleepHours: 7.5
    }
  });

  // Seed sample medications
  const existingMeds = await prisma.medication.findMany({ where: { userId: demoUser.id } });
  if (existingMeds.length === 0) {
    const med1 = await prisma.medication.create({
      data: {
        userId: demoUser.id,
        name: 'Metformin 500mg',
        dosage: '1 Tablet',
        scheduleTimes: ['08:00 AM (After Breakfast)'],
        notes: 'Take with full glass of water',
        active: true
      }
    });

    await prisma.medicationLog.create({
      data: {
        medicationId: med1.id,
        scheduledFor: new Date(),
        takenAt: new Date(),
        status: 'taken'
      }
    });

    await prisma.medication.create({
      data: {
        userId: demoUser.id,
        name: 'Telmisartan 40mg',
        dosage: '1 Tablet',
        scheduleTimes: ['09:00 PM (After Dinner)'],
        notes: 'Blood pressure maintenance',
        active: true
      }
    });
  }

  // Seed sample family circle
  const existingFamily = await prisma.family.findFirst({ where: { ownerId: demoUser.id } });
  if (!existingFamily) {
    const fam = await prisma.family.create({
      data: {
        name: 'Harish Family Circle',
        ownerId: demoUser.id,
        inviteCode: 'HELYRA-FAMILY-2026'
      }
    });

    await prisma.familyMember.create({
      data: {
        familyId: fam.id,
        userId: demoUser.id,
        role: 'admin'
      }
    });
  }

  console.log('[Seed] Database seeded successfully:');
  console.log(`  User: ${demoEmail}`);
  console.log(`  Password: ${defaultPassword}`);
}

seed()
  .catch((e) => {
    console.error('[Seed Error]:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * HELYRA Authorized Health Data API Router (PostgreSQL + Prisma)
 * 
 * Enforces BOLA / IDOR Protection:
 * - Every query and mutation is strictly scoped to req.user.id
 * - Strict Zod validation on every request body
 * - Provides typed endpoints for daily summaries, hourly steps, workouts, medications, and documents
 * - Backward-compatible shim for PUT /api/health-data
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from './db';
import { prisma } from './prismaClient';
import { requireAuth } from './authMiddleware';
import { storageAdapter } from './storage';

export const healthDataRouter = Router();

// Apply strict authentication to all health data operations
healthDataRouter.use(requireAuth);

// ==========================================
// ZOD VALIDATION SCHEMAS
// ==========================================
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const dailySummarySchema = z.object({
  date: z.string().regex(dateRegex, 'Date must be formatted as YYYY-MM-DD'),
  steps: z.number().int().min(0).max(200000).optional(),
  distance: z.number().min(0).max(500).optional(),
  activeMinutes: z.number().int().min(0).max(1440).optional(),
  waterLiters: z.number().min(0).max(50).optional(),
  sleepHours: z.number().min(0).max(24).optional()
});

const hourlyStepSchema = z.object({
  date: z.string().regex(dateRegex, 'Date must be formatted as YYYY-MM-DD'),
  hour: z.number().int().min(0).max(23),
  steps: z.number().int().min(0).max(50000)
});

const workoutSchema = z.object({
  type: z.string().min(1).max(50),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional().nullable(),
  steps: z.number().int().min(0).optional(),
  distanceM: z.number().min(0).optional(),
  route: z.any().optional()
});

const medicationSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(150),
  dosage: z.string().min(1).max(100),
  scheduleTimes: z.array(z.string()).min(1),
  notes: z.string().max(500).optional().nullable(),
  active: z.boolean().optional()
});

const medicationLogSchema = z.object({
  scheduledFor: z.string().datetime(),
  takenAt: z.string().datetime().optional().nullable(),
  status: z.enum(['taken', 'skipped', 'pending', 'remind_later'])
});

const documentSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.string().min(1).max(50),
  fileBase64: z.string().optional(),
  contentType: z.string().optional(),
  extractedJson: z.any().optional()
});

const legacyHealthDataSchema = z.object({
  dailyRecords: z.record(z.any()).optional(),
  medications: z.array(z.any()).optional(),
  documents: z.array(z.any()).optional(),
  family: z.any().optional(),
  userProfile: z.any().optional()
});

// ==========================================
// 1. COMPATIBILITY AGGREGATED ENDPOINTS
// ==========================================

/**
 * GET /api/health-data
 * Retrieve health records strictly belonging to the authenticated user
 */
healthDataRouter.get('/', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = await db.getHealthData(userId);

  if (!data) {
    return res.json({
      userId,
      dailyRecords: {},
      medications: [],
      documents: [],
      family: null,
      userProfile: null,
      updatedAt: new Date().toISOString()
    });
  }

  return res.json(data);
});

/**
 * PUT /api/health-data (Compatibility Shim)
 * Updates records in the new PostgreSQL tables atomically using a transaction
 */
healthDataRouter.put('/', async (req: Request, res: Response) => {
  const parsed = legacyHealthDataSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload format', details: parsed.error.issues });
  }

  const userId = req.user!.id;
  await db.setHealthData(userId, parsed.data);

  return res.json({
    success: true,
    message: 'Health records securely updated in PostgreSQL.',
    updatedAt: new Date().toISOString()
  });
});

// ==========================================
// 2. TYPED DAILY HEALTH SUMMARY ENDPOINTS
// ==========================================

/**
 * GET /api/health-data/daily
 * Query daily summaries with optional date filtering
 */
healthDataRouter.get('/daily', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { date, startDate, endDate } = req.query;

  if (date && typeof date === 'string') {
    const daily = await prisma.healthDaily.findUnique({
      where: { userId_date: { userId, date } }
    });
    return res.json({ daily: daily || null });
  }

  const whereClause: any = { userId };
  if (startDate && endDate) {
    whereClause.date = { gte: String(startDate), lte: String(endDate) };
  }

  const dailies = await prisma.healthDaily.findMany({
    where: whereClause,
    orderBy: { date: 'desc' },
    take: 31
  });

  return res.json({ dailies });
});

/**
 * POST /api/health-data/daily
 * Upsert daily summary
 */
healthDataRouter.post('/daily', async (req: Request, res: Response) => {
  const parsed = dailySummarySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
  }

  const userId = req.user!.id;
  const { date, steps, distance, activeMinutes, waterLiters, sleepHours } = parsed.data;

  const result = await prisma.healthDaily.upsert({
    where: { userId_date: { userId, date } },
    update: {
      steps: steps ?? undefined,
      distance: distance ?? undefined,
      activeMinutes: activeMinutes ?? undefined,
      waterLiters: waterLiters ?? undefined,
      sleepHours: sleepHours ?? undefined
    },
    create: {
      userId,
      date,
      steps: steps || 0,
      distance: distance || 0,
      activeMinutes: activeMinutes || 0,
      waterLiters: waterLiters || 0,
      sleepHours: sleepHours || 0
    }
  });

  return res.json({ success: true, daily: result });
});

// ==========================================
// 3. TYPED HOURLY STEPS ENDPOINTS
// ==========================================

healthDataRouter.get('/steps/hourly', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { date } = req.query;

  if (!date || typeof date !== 'string') {
    return res.status(400).json({ error: 'date query parameter is required (YYYY-MM-DD)' });
  }

  const hourly = await prisma.stepHourly.findMany({
    where: { userId, date },
    orderBy: { hour: 'asc' }
  });

  return res.json({ date, hourly });
});

healthDataRouter.post('/steps/hourly', async (req: Request, res: Response) => {
  const parsed = hourlyStepSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
  }

  const userId = req.user!.id;
  const { date, hour, steps } = parsed.data;

  const result = await prisma.stepHourly.upsert({
    where: { userId_date_hour: { userId, date, hour } },
    update: { steps },
    create: { userId, date, hour, steps }
  });

  return res.json({ success: true, stepHourly: result });
});

// ==========================================
// 4. TYPED WORKOUTS ENDPOINTS
// ==========================================

healthDataRouter.get('/workouts', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const workouts = await prisma.workout.findMany({
    where: { userId },
    orderBy: { startedAt: 'desc' },
    take: 20
  });

  return res.json({ workouts });
});

healthDataRouter.post('/workouts', async (req: Request, res: Response) => {
  const parsed = workoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
  }

  const userId = req.user!.id;
  const workout = await prisma.workout.create({
    data: {
      userId,
      type: parsed.data.type,
      startedAt: new Date(parsed.data.startedAt),
      endedAt: parsed.data.endedAt ? new Date(parsed.data.endedAt) : null,
      steps: parsed.data.steps || 0,
      distanceM: parsed.data.distanceM || 0,
      route: parsed.data.route ?? null
    }
  });

  return res.status(201).json({ success: true, workout });
});

// ==========================================
// 5. TYPED MEDICATIONS & LOGS ENDPOINTS
// ==========================================

healthDataRouter.get('/medications', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const medications = await prisma.medication.findMany({
    where: { userId },
    include: {
      logs: {
        orderBy: { scheduledFor: 'desc' },
        take: 7
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return res.json({ medications });
});

healthDataRouter.post('/medications', async (req: Request, res: Response) => {
  const parsed = medicationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
  }

  const userId = req.user!.id;
  const { id, name, dosage, scheduleTimes, notes, active } = parsed.data;

  if (id) {
    // BOLA check: ensure user owns the medication
    const existing = await prisma.medication.findFirst({
      where: { id, userId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Medication not found or unauthorized' });
    }

    const updated = await prisma.medication.update({
      where: { id },
      data: {
        name,
        dosage,
        scheduleTimes,
        notes: notes ?? null,
        active: active !== undefined ? active : true
      }
    });
    return res.json({ success: true, medication: updated });
  }

  const created = await prisma.medication.create({
    data: {
      userId,
      name,
      dosage,
      scheduleTimes,
      notes: notes ?? null,
      active: active !== undefined ? active : true
    }
  });

  return res.status(201).json({ success: true, medication: created });
});

healthDataRouter.delete('/medications/:id', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  // BOLA protected delete
  const existing = await prisma.medication.findFirst({
    where: { id, userId }
  });
  if (!existing) {
    return res.status(404).json({ error: 'Medication not found or unauthorized' });
  }

  await prisma.medication.delete({ where: { id } });
  return res.json({ success: true, message: 'Medication deleted.' });
});

healthDataRouter.post('/medications/:id/log', async (req: Request, res: Response) => {
  const parsed = medicationLogSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
  }

  const userId = req.user!.id;
  const { id } = req.params;

  // BOLA verification
  const med = await prisma.medication.findFirst({
    where: { id, userId }
  });
  if (!med) {
    return res.status(404).json({ error: 'Medication not found or unauthorized' });
  }

  const log = await prisma.medicationLog.create({
    data: {
      medicationId: id,
      scheduledFor: new Date(parsed.data.scheduledFor),
      takenAt: parsed.data.takenAt ? new Date(parsed.data.takenAt) : null,
      status: parsed.data.status
    }
  });

  return res.status(201).json({ success: true, log });
});

// ==========================================
// 6. TYPED MEDICAL DOCUMENTS & OBJECT STORAGE
// ==========================================

healthDataRouter.get('/documents', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const docs = await prisma.document.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  const withSignedUrls = await Promise.all(
    docs.map(async (doc) => ({
      id: doc.id,
      title: doc.title,
      type: doc.type,
      storageKey: doc.storageKey,
      extractedJson: doc.extractedJson,
      downloadUrl: await storageAdapter.getSignedDownloadUrl(doc.storageKey, doc.title, 900),
      createdAt: doc.createdAt.toISOString()
    }))
  );

  return res.json({ documents: withSignedUrls });
});

healthDataRouter.post('/documents', async (req: Request, res: Response) => {
  const parsed = documentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
  }

  const userId = req.user!.id;
  const { title, type, fileBase64, contentType, extractedJson } = parsed.data;

  let storageKey = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  if (fileBase64) {
    const cleanBase64 = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;
    const buffer = Buffer.from(cleanBase64, 'base64');
    const uploadResult = await storageAdapter.upload(storageKey, buffer, contentType || 'application/pdf');
    storageKey = uploadResult.storageKey;
  }

  const document = await prisma.document.create({
    data: {
      userId,
      title,
      type,
      storageKey,
      extractedJson: extractedJson ?? null
    }
  });

  const downloadUrl = await storageAdapter.getSignedDownloadUrl(storageKey, title, 900);

  return res.status(201).json({
    success: true,
    document: {
      ...document,
      downloadUrl
    }
  });
});

healthDataRouter.delete('/documents/:id', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  // BOLA protected delete
  const doc = await prisma.document.findFirst({
    where: { id, userId }
  });
  if (!doc) {
    return res.status(404).json({ error: 'Document not found or unauthorized' });
  }

  // Delete from Postgres and Storage
  await prisma.document.delete({ where: { id } });
  await storageAdapter.delete(doc.storageKey);

  return res.json({ success: true, message: 'Document and stored file deleted.' });
});

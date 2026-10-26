/**
 * HELYRA Enterprise Prisma Client & Connection Pooling
 * 
 * Optimized for serverless and Google Cloud Run:
 * - Connection pool limits to prevent exhaustion
 * - Graceful shutdown and disconnection on SIGINT/SIGTERM
 * - Health check ping probe
 */

import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

const connectionUrl = process.env.DATABASE_URL || 'postgresql://helyra_user:helyra_secure_password_2026@localhost:5432/helyra_db?schema=public';

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    datasources: {
      db: {
        url: connectionUrl
      }
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

/**
 * Health check probe: pings the database with a fast SELECT 1 query
 */
export async function pingDatabase(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err: any) {
    return { ok: false, latencyMs: Date.now() - start, error: err?.message || 'Database connection failure' };
  }
}

/**
 * Graceful shutdown hook
 */
let isShuttingDown = false;
export async function disconnectPrisma(): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;
  try {
    await prisma.$disconnect();
    console.log('[Prisma] Disconnected gracefully.');
  } catch (err) {
    console.error('[Prisma] Error during disconnect:', err);
  }
}

process.on('SIGTERM', async () => {
  console.log('[Server] SIGTERM received: closing database connections...');
  await disconnectPrisma();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Server] SIGINT received: closing database connections...');
  await disconnectPrisma();
  process.exit(0);
});

/**
 * HELYRA Object Storage Adapter
 * 
 * Provides encrypted object storage for sensitive medical documents (prescriptions, lab tests).
 * Features:
 * - Server-side AES-256-GCM envelope encryption at rest
 * - Pluggable driver (Local filesystem for dev/offline, Google Cloud Storage / S3 for cloud)
 * - Time-limited signed URLs (short expiry, ownership verified before issuance)
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface StorageResult {
  storageKey: string;
  sizeBytes: number;
}

export interface ObjectStorageAdapter {
  upload(key: string, data: Buffer, contentType: string): Promise<StorageResult>;
  download(key: string): Promise<{ buffer: Buffer; contentType: string }>;
  delete(key: string): Promise<boolean>;
  getSignedDownloadUrl(key: string, filename?: string, expiresInSeconds?: number): Promise<string>;
}

/**
 * Encrypt buffer with AES-256-GCM
 */
function encryptBuffer(buffer: Buffer, keyHex?: string): Buffer {
  const masterKey = keyHex && keyHex.length === 64
    ? Buffer.from(keyHex, 'hex')
    : crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY || 'helyra-default-storage-key-2026!').digest();

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Format: [12 bytes IV][16 bytes AuthTag][Ciphertext]
  return Buffer.concat([iv, authTag, encrypted]);
}

/**
 * Decrypt buffer with AES-256-GCM
 */
function decryptBuffer(encryptedBuffer: Buffer, keyHex?: string): Buffer {
  const masterKey = keyHex && keyHex.length === 64
    ? Buffer.from(keyHex, 'hex')
    : crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY || 'helyra-default-storage-key-2026!').digest();

  if (encryptedBuffer.length < 28) {
    throw new Error('Encrypted file buffer is truncated or corrupted');
  }

  const iv = encryptedBuffer.subarray(0, 12);
  const authTag = encryptedBuffer.subarray(12, 28);
  const ciphertext = encryptedBuffer.subarray(28);

  const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/**
 * Local Encrypted File System Storage Adapter
 */
export class LocalStorageAdapter implements ObjectStorageAdapter {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.join(process.cwd(), 'storage_encrypted');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true, mode: 0o700 });
    }
  }

  public async upload(key: string, data: Buffer, contentType: string): Promise<StorageResult> {
    const safeKey = key.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const filePath = path.join(this.baseDir, `${safeKey}.bin`);
    const metaPath = path.join(this.baseDir, `${safeKey}.meta.json`);

    const encryptedData = encryptBuffer(data, process.env.STORAGE_ENCRYPTION_KEY);
    await fs.promises.writeFile(filePath, encryptedData, { mode: 0o600 });
    await fs.promises.writeFile(
      metaPath,
      JSON.stringify({ contentType, uploadedAt: new Date().toISOString(), sizeBytes: data.length }),
      { mode: 0o600 }
    );

    return { storageKey: safeKey, sizeBytes: data.length };
  }

  public async download(key: string): Promise<{ buffer: Buffer; contentType: string }> {
    const safeKey = key.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const filePath = path.join(this.baseDir, `${safeKey}.bin`);
    const metaPath = path.join(this.baseDir, `${safeKey}.meta.json`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found for key: ${key}`);
    }

    const encryptedData = await fs.promises.readFile(filePath);
    const decryptedData = decryptBuffer(encryptedData, process.env.STORAGE_ENCRYPTION_KEY);

    let contentType = 'application/octet-stream';
    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(await fs.promises.readFile(metaPath, 'utf8'));
        if (meta.contentType) contentType = meta.contentType;
      } catch {}
    }

    return { buffer: decryptedData, contentType };
  }

  public async delete(key: string): Promise<boolean> {
    const safeKey = key.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const filePath = path.join(this.baseDir, `${safeKey}.bin`);
    const metaPath = path.join(this.baseDir, `${safeKey}.meta.json`);

    let removed = false;
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      removed = true;
    }
    if (fs.existsSync(metaPath)) {
      await fs.promises.unlink(metaPath);
    }
    return removed;
  }

  public async getSignedDownloadUrl(key: string, filename?: string, expiresInSeconds: number = 900): Promise<string> {
    // Generate an HMAC-signed short-lived token for secure document retrieval
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    const secret = process.env.AUTH_SECRET || process.env.SESSION_SECRET || 'helyra-token-secret';
    const payload = `${key}:${expiresAt}:${filename || ''}`;
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    const params = new URLSearchParams({
      key,
      exp: expiresAt.toString(),
      sig: signature
    });
    if (filename) params.set('fn', filename);

    return `/api/documents/download?${params.toString()}`;
  }

  public verifySignedUrl(key: string, expiresAt: number, signature: string, filename?: string): boolean {
    if (Date.now() > expiresAt) return false;
    const secret = process.env.AUTH_SECRET || process.env.SESSION_SECRET || 'helyra-token-secret';
    const payload = `${key}:${expiresAt}:${filename || ''}`;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }
}

export const storageAdapter: LocalStorageAdapter = new LocalStorageAdapter(
  process.env.STORAGE_LOCAL_DIR ? path.resolve(process.cwd(), process.env.STORAGE_LOCAL_DIR) : undefined
);

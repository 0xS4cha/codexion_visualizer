import type { VercelRequest, VercelResponse } from '@vercel/node';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from './firebaseAdmin.js';

const ALLOWED_HEADERS = 'Accept, Content-Type, Authorization';

function allowedOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

export function applyCors(req: VercelRequest, res: VercelResponse, methods: string[]): boolean {
  const origin = req.headers.origin;
  const allowed = allowedOrigins();
  if (origin && (allowed.includes('*') || allowed.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', [...methods, 'OPTIONS'].join(','));
  res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return false;
  }
  if (!req.method || !methods.includes(req.method)) {
    res.status(405).json({ error: 'Method not allowed' });
    return false;
  }
  return true;
}

export function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const ip = value?.split(',')[0]?.trim() || req.headers['x-real-ip']?.toString() || req.socket?.remoteAddress || 'unknown';
  return ip.replace(/[^a-zA-Z0-9:._-]/g, '_');
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface AuthUser {
  uid: string;
  login: string;
}

export async function requireUser(req: VercelRequest): Promise<AuthUser> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HttpError(401, 'Token not found or format invalid');
  }
  try {
    const decoded = await getAdminAuth().verifyIdToken(authHeader.slice('Bearer '.length));
    const login = typeof decoded.login === 'string' ? decoded.login : decoded.uid;
    return { uid: decoded.uid, login };
  } catch {
    throw new HttpError(401, 'Token invalid or expired');
  }
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<void> {
  const db = getAdminDb();
  const now = Date.now();
  const windowStart = now - (now % windowMs);
  const docId = `${key}:${windowStart}`.replace(/\//g, '_').slice(0, 1400);
  const ref = db.collection('rateLimits').doc(docId);

  const count = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = (snap.exists ? (snap.data()?.count as number) : 0) ?? 0;
    if (current >= limit) return current + 1;
    tx.set(
      ref,
      { count: FieldValue.increment(1), expiresAt: new Date(windowStart + windowMs * 2) },
      { merge: true }
    );
    return current + 1;
  });

  if (count > limit) {
    throw new HttpError(429, 'Too many requests, slow down.');
  }
}

export function sendError(res: VercelResponse, error: unknown, context: string) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error(`${context}:`, error);
  return res.status(500).json({ error: 'Internal server error' });
}

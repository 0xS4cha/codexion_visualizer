import { VercelRequest, VercelResponse } from '@vercel/node';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from './_utils/firebaseAdmin.js';
import { applyCors, getClientIp, HttpError, rateLimit, sendError } from './_utils/security.js';
import { cleanDocId, validateRun } from './_utils/validation.js';
import { escapeKey } from './_utils/stats.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res, ['GET', 'POST'])) return;

  try {
    const db = getAdminDb();
    const ip = getClientIp(req);

    if (req.method === 'GET') {
      await rateLimit(`runs-read:${ip}`, 120, 60 * 1000);
      const id = cleanDocId(req.query.id);
      const snap = await db.collection('runs').doc(id).get();
      if (!snap.exists) throw new HttpError(404, 'Run not found');
      const { command, output, instantActionPadding, dongleCooldown } = snap.data() ?? {};
      res.setHeader('Cache-Control', 'public, max-age=3600, immutable');
      return res.status(200).json({ command, output, instantActionPadding, dongleCooldown });
    }

    await rateLimit(`runs-write:${ip}`, 20, 60 * 60 * 1000);
    const run = validateRun(req.body);
    const country = (req.headers['x-vercel-ip-country']?.toString() ?? process.env.DEV_COUNTRY ?? 'unknown').toUpperCase();
    const docRef = db.collection('runs').doc();
    const batch = db.batch();
    batch.set(docRef, { ...run, country, createdAt: FieldValue.serverTimestamp() });
    batch.set(db.collection('stats').doc('global'), {
      runsByCountry: { [escapeKey(country)]: FieldValue.increment(1) },
    }, { merge: true });
    await batch.commit();
    return res.status(200).json({ id: docRef.id });
  } catch (error) {
    return sendError(res, error, 'Error handling run');
  }
}

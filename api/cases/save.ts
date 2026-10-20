import { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminDb } from '../_utils/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';
import { applyCors, rateLimit, requireUser, sendError } from '../_utils/security.js';
import { validateEdgecase } from '../_utils/validation.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res, ['POST'])) return;

  try {
    const user = await requireUser(req);
    await rateLimit(`cases-save:${user.uid}`, 5, 60 * 60 * 1000);
    const edgecase = validateEdgecase(req.body);

    const docRef = await getAdminDb().collection('edgecases').add({
      ...edgecase,
      author: user.login,
      authorUid: user.uid,
      votes: 0,
      votedBy: {},
      commentCount: 0,
      createdAt: FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ success: true, id: docRef.id });
  } catch (error) {
    return sendError(res, error, 'Error saving edgecase');
  }
}

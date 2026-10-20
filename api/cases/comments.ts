import { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminDb } from '../_utils/firebaseAdmin.js';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { applyCors, getClientIp, HttpError, rateLimit, requireUser, sendError } from '../_utils/security.js';
import { cleanDocId, validateComment } from '../_utils/validation.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res, ['GET', 'POST', 'DELETE'])) return;

  try {
    const db = getAdminDb();

    if (req.method === 'GET') {
      await rateLimit(`comments-read:${getClientIp(req)}`, 120, 60 * 1000);
      const id = cleanDocId(req.query.id);
      const snap = await db.collection('edgecases').doc(id).collection('comments').orderBy('createdAt', 'asc').limit(200).get();
      const comments = snap.docs.map((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : null;
        return { id: doc.id, author: data.author, text: data.text, createdAt };
      });
      return res.status(200).json({ comments });
    }

    const user = await requireUser(req);

    if (req.method === 'POST') {
      await rateLimit(`comments-write:${user.uid}`, 10, 60 * 1000);
      const { id, text } = validateComment(req.body);
      const caseRef = db.collection('edgecases').doc(cleanDocId(id));
      const commentRef = caseRef.collection('comments').doc();
      await db.runTransaction(async (tx) => {
        const caseSnap = await tx.get(caseRef);
        if (!caseSnap.exists) throw new HttpError(404, 'Edgecase not found');
        tx.set(commentRef, { author: user.login, authorUid: user.uid, text, createdAt: FieldValue.serverTimestamp() });
        tx.update(caseRef, { commentCount: FieldValue.increment(1) });
      });
      return res.status(200).json({ comment: { id: commentRef.id, author: user.login, text, createdAt: Date.now() } });
    }

    const id = cleanDocId(req.body?.id);
    const commentId = cleanDocId(req.body?.commentId);
    const caseRef = db.collection('edgecases').doc(id);
    const commentRef = caseRef.collection('comments').doc(commentId);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(commentRef);
      if (!snap.exists) throw new HttpError(404, 'Comment not found');
      if (snap.data()?.authorUid !== user.uid) throw new HttpError(403, 'You can only delete your own comments');
      tx.delete(commentRef);
      tx.update(caseRef, { commentCount: FieldValue.increment(-1) });
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    return sendError(res, error, 'Error handling comments');
  }
}

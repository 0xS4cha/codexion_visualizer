import { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminDb } from '../_utils/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';
import { applyCors, HttpError, rateLimit, requireUser, sendError } from '../_utils/security.js';
import { cleanDocId } from '../_utils/validation.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res, ['POST'])) return;

  try {
    const user = await requireUser(req);
    await rateLimit(`cases-vote:${user.uid}`, 60, 60 * 1000);
    const id = cleanDocId(req.body?.id);
    const voteType = req.body?.voteType;
    if (voteType !== 'up' && voteType !== 'down') {
      throw new HttpError(400, 'Invalid parameters');
    }

    const adminDb = getAdminDb();
    const edgecaseRef = adminDb.collection('edgecases').doc(id);
    const userLogin = user.login;

    const result = await adminDb.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(edgecaseRef);
      if (!docSnap.exists) {
        throw new HttpError(404, 'Edgecase not found');
      }

      const data = docSnap.data() ?? {};
      const votedBy: Record<string, 'up' | 'down'> = data.votedBy || {};
      const previousVote = votedBy[userLogin];

      let voteChange = 0;
      const newVotedBy = { ...votedBy };

      if (previousVote === voteType) {
        voteChange = voteType === 'up' ? -1 : 1;
        delete newVotedBy[userLogin];
      } else {
        if (previousVote === 'up' && voteType === 'down') {
          voteChange = -2;
        } else if (previousVote === 'down' && voteType === 'up') {
          voteChange = 2;
        } else if (!previousVote && voteType === 'up') {
          voteChange = 1;
        } else if (!previousVote && voteType === 'down') {
          voteChange = -1;
        }
        newVotedBy[userLogin] = voteType;
      }

      const newVotes = (data.votes || 0) + voteChange;

      transaction.update(edgecaseRef, {
        votes: FieldValue.increment(voteChange),
        votedBy: newVotedBy
      });

      return { newVotes, newVotedBy };
    });

    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, error, 'Error voting on edgecase');
  }
}

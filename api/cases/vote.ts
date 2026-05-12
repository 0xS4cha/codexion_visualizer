import { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminAuth, getAdminDb } from '../_utils/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token not found or format invalid' });
    }

    const adminAuth = getAdminAuth();
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    const uid = decodedToken.uid;
    const { id, voteType, userLogin } = req.body;

    if (!id || !voteType || !['up', 'down'].includes(voteType) || !userLogin) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    const adminDb = getAdminDb();
    const eachcaseRef = adminDb.collection("eachcases").doc(id);
    
    const result = await adminDb.runTransaction(async (transaction: any) => {
      const docSnap = await transaction.get(eachcaseRef);
      if (!docSnap.exists) {
        throw new Error('Document does not exist!');
      }

      const data = docSnap.data();
      const votedBy = data.votedBy || {};
      const previousVote = votedBy[userLogin];

      let voteChange = 0;
      let newVotedBy = { ...votedBy };

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

      const currentVotes = data.votes || 0;
      const newVotes = currentVotes + voteChange;

      transaction.update(eachcaseRef, {
        votes: admin.firestore.FieldValue.increment(voteChange),
        votedBy: newVotedBy
      });

      return { newVotes, newVotedBy };
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error voting on eachcase:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
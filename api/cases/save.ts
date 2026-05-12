import { VercelRequest, VercelResponse } from '@vercel/node';
import { adminAuth, adminDb } from '../_utils/firebaseAdmin';
import * as admin from 'firebase-admin';

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

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const {
      title,
      description,
      tags,
      command,
      instantActionPadding,
      dongleCooldown,
      output,
      author,
      authorDisplayName
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const docRef = await adminDb.collection('eachcases').add({
      title,
      description,
      tags: tags || [],
      command,
      instantActionPadding: instantActionPadding || 0,
      dongleCooldown: dongleCooldown || 0,
      output,
      author: author || uid, 
      authorDisplayName: authorDisplayName || 'Unknown User',
      votes: 0,
      votedBy: {},
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(200).json({ success: true, id: docRef.id });
  } catch (error: any) {
    console.error('Error saving eachcase:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
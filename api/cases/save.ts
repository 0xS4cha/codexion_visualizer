import { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminAuth, getAdminDb } from '../_utils/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';

const AVAILABLE_TAGS = [
  "Burnout",
  "Deadlock",
  "Tricky",
  "Stack",
  "Memory",
  "Infinite Loop",
  "Segfault",
  "Leaks"
];

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
    const userLogin = decodedToken.login;

    const {
      title,
      description,
      tags,
      command,
      instantActionPadding,
      dongleCooldown,
      output
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const adminDb = getAdminDb();
    const docRef = await adminDb.collection('edgecases').add({
      title,
      description,
      tags: tags || [],
      command,
      instantActionPadding: instantActionPadding || 0,
      dongleCooldown: dongleCooldown || 0,
      output,
      author: userLogin || uid,
      votes: 0,
      votedBy: {},
      createdAt: FieldValue.serverTimestamp()
    });

    return res.status(200).json({ success: true, id: docRef.id });
  } catch (error: any) {
    console.error('Error saving edgecase:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
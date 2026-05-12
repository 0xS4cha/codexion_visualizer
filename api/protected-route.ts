import { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminAuth } from './_utils/firebaseAdmin.js';

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

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token not found or format invalid' });
    }

    const adminAuth = getAdminAuth();
    const token = authHeader.split('Bearer ')[1];

    const decodedToken = await adminAuth.verifyIdToken(token);
    
    const uid = decodedToken.uid;


    return res.status(200).json({ 
      success: true, 
      message: 'Authentification réussie !', 
      uid: uid 
    });

  } catch (error: any) {
    return res.status(401).json({ error: 'Token invalid or expirate', details: error.message });
  }
}

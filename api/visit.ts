import { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminDb } from './_utils/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  try {
    const country =
      req.headers['x-vercel-ip-country']?.toString() ??
      process.env.DEV_COUNTRY ??
      'unknown';

    const adminDb = getAdminDb();

    await adminDb
      .collection('countries')
      .doc(country)
      .set(
        {
          count: FieldValue.increment(1)
        },
        {
          merge: true
        }
      );

    return res.status(200).json({
      success: true,
      country
    });
  } catch (error: any) {
    console.error('Error tracking visit:', error);

    return res.status(500).json({
      error: 'Internal server error'
    });
  }
}
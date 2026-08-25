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
    const country = req.headers['x-vercel-ip-country']?.toString() ?? process.env.DEV_COUNTRY ?? 'unknown';
    const city = req.headers['x-vercel-ip-city']?.toString() ?? 'unknown';
    const latitude = parseFloat(req.headers['x-vercel-ip-latitude']?.toString() || '0');
    const longitude = parseFloat(req.headers['x-vercel-ip-longitude']?.toString() || '0');

    const userAgent = req.headers['user-agent']?.toString() ?? 'unknown';
    let deviceCategory = 'desktop';
    if (/mobile/i.test(userAgent)) deviceCategory = 'mobile';
    if (/tablet|ipad/i.test(userAgent)) deviceCategory = 'tablet';

    let browser = 'unknown';
    if (/edg/i.test(userAgent)) browser = 'Edge';
    else if (/chrome|crios/i.test(userAgent)) browser = 'Chrome';
    else if (/firefox|fxios/i.test(userAgent)) browser = 'Firefox';
    else if (/safari/i.test(userAgent)) browser = 'Safari';
    else if (/opera|opr/i.test(userAgent)) browser = 'Opera';

    let refererUrl = 'Direct';
    try {
      const rawReferer = req.headers['referer']?.toString();
      if (rawReferer) {
        const url = new URL(rawReferer);
        refererUrl = url.hostname.replace('www.', '');
      }
    } catch (e) { }

    const path = req.body?.path ?? '/';
    const today = new Date().toISOString().split('T')[0];

    const adminDb = getAdminDb();

    await adminDb
      .collection('countries')
      .doc(country)
      .set({ count: FieldValue.increment(1) }, { merge: true });

    const safeReferer = refererUrl.replace(/\./g, '_');
    const safePath = path.replace(/\./g, '_').replace(/\//g, '_slash_');
    const safeCity = city.replace(/\./g, '_');
    const safeCountry = country.replace(/\./g, '_');

    await adminDb.collection('stats').doc('global').set({
      totalVisitors: FieldValue.increment(1),
      browsers: {
        [browser]: FieldValue.increment(1)
      },
      devices: {
        [deviceCategory]: FieldValue.increment(1)
      },
      referers: {
        [safeReferer]: FieldValue.increment(1)
      },
      paths: {
        [safePath]: FieldValue.increment(1)
      },
      countries: {
        [safeCountry]: FieldValue.increment(1)
      },
      daily: {
        [today]: FieldValue.increment(1)
      },
      cities: {
        [safeCity]: {
          count: FieldValue.increment(1),
          lat: latitude,
          lng: longitude
        }
      }
    }, { merge: true });

    await adminDb.collection('visits').add({
      timestamp: FieldValue.serverTimestamp(),
      country,
      city,
      location: { lat: latitude, lng: longitude },
      userAgent,
      browser,
      deviceCategory,
      referer: refererUrl,
      path,
    });

    return res.status(200).json({
      success: true,
      country,
      tracked: true
    });
  } catch (error: any) {
    console.error('Error tracking visit:', error);

    return res.status(500).json({
      error: 'Internal server error'
    });
  }
}
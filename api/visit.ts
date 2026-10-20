import { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminDb } from './_utils/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';
import { applyCors, getClientIp, rateLimit, sendError } from './_utils/security.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (!applyCors(req, res, ['POST'])) return;

  try {
    await rateLimit(`visit:${getClientIp(req)}`, 10, 60 * 1000);
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

    const rawPath = typeof req.body?.path === 'string' ? req.body.path : '/';
    const path = rawPath.slice(0, 100);
    const today = new Date().toISOString().split('T')[0];

    const adminDb = getAdminDb();

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
  } catch (error) {
    return sendError(res, error, 'Error tracking visit');
  }
}
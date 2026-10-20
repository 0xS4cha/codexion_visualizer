import { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminDb } from './_utils/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';
import { applyCors, getClientIp, rateLimit, sendError } from './_utils/security.js';
import { dateKey, escapeKey, safeDecode } from './_utils/stats.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (!applyCors(req, res, ['POST'])) return;

  try {
    await rateLimit(`visit:${getClientIp(req)}`, 30, 60 * 1000);
    const country = (req.headers['x-vercel-ip-country']?.toString() ?? process.env.DEV_COUNTRY ?? 'unknown').toUpperCase();
    const city = safeDecode(req.headers['x-vercel-ip-city']?.toString() ?? 'unknown');
    const latitude = parseFloat(req.headers['x-vercel-ip-latitude']?.toString() || '0');
    const longitude = parseFloat(req.headers['x-vercel-ip-longitude']?.toString() || '0');

    const userAgent = req.headers['user-agent']?.toString() ?? 'unknown';
    let deviceCategory = 'desktop';
    if (/mobile/i.test(userAgent)) deviceCategory = 'mobile';
    if (/tablet|ipad/i.test(userAgent)) deviceCategory = 'tablet';

    let browser = 'unknown';
    if (/edg/i.test(userAgent)) browser = 'Edge';
    else if (/opera|opr/i.test(userAgent)) browser = 'Opera';
    else if (/chrome|crios/i.test(userAgent)) browser = 'Chrome';
    else if (/firefox|fxios/i.test(userAgent)) browser = 'Firefox';
    else if (/safari/i.test(userAgent)) browser = 'Safari';

    let refererUrl = 'Direct';
    try {
      const rawReferer = req.headers['referer']?.toString();
      if (rawReferer) {
        const url = new URL(rawReferer);
        refererUrl = url.hostname.replace('www.', '');
      }
    } catch { }

    const rawPath = typeof req.body?.path === 'string' ? req.body.path : '/';
    const path = rawPath.split('?')[0].slice(0, 100) || '/';
    const firstToday = req.body?.firstToday === true;
    const today = dateKey(new Date());

    const adminDb = getAdminDb();
    const unique = firstToday ? FieldValue.increment(1) : FieldValue.increment(0);

    const breakdowns = {
      browsers: { [browser]: FieldValue.increment(1) },
      devices: { [deviceCategory]: FieldValue.increment(1) },
      referers: { [escapeKey(refererUrl)]: FieldValue.increment(1) },
      paths: { [escapeKey(path)]: FieldValue.increment(1) },
      countries: { [escapeKey(country)]: FieldValue.increment(1) },
      cities: {
        [escapeKey(city)]: {
          count: FieldValue.increment(1),
          lat: latitude,
          lng: longitude,
          country,
        },
      },
    };

    const globalRef = adminDb.collection('stats').doc('global');
    const batch = adminDb.batch();

    batch.set(globalRef, {
      totalVisitors: FieldValue.increment(1),
      uniqueVisitors: unique,
      daily: { [today]: FieldValue.increment(1) },
      uniqueDaily: { [today]: unique },
      ...breakdowns,
    }, { merge: true });

    batch.set(globalRef.collection('days').doc(today), {
      visits: FieldValue.increment(1),
      uniques: unique,
      ...breakdowns,
    }, { merge: true });

    batch.set(adminDb.collection('visits').doc(), {
      timestamp: FieldValue.serverTimestamp(),
      country,
      city,
      location: { lat: latitude, lng: longitude },
      userAgent,
      browser,
      deviceCategory,
      referer: refererUrl,
      path,
      firstToday,
    });

    await batch.commit();

    return res.status(200).json({
      success: true,
      country,
      tracked: true
    });
  } catch (error) {
    return sendError(res, error, 'Error tracking visit');
  }
}

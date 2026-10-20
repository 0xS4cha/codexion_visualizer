import { VercelRequest, VercelResponse } from '@vercel/node';
import { AggregateField, FieldPath, Timestamp } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { getAdminDb } from './_utils/firebaseAdmin.js';
import { applyCors, sendError } from './_utils/security.js';
import { liveVisitors } from './_utils/live.js';
import type { ProductStats, RecentVisit, StatsResponse } from '../src/types/stats.js';
import {
  type CityRecord,
  buildSeries,
  computeGrowth,
  countryRows,
  dateKey,
  dayKeys,
  daysBetween,
  mergeCities,
  mergeCounts,
  normalizeCountries,
  parseRange,
  publicCities,
  roundCoord,
  safeDecode,
  sumDays,
  toRows,
} from './_utils/stats.js';

const RECENT_LIMIT = 30;

type Breakdowns = {
  paths: Record<string, number>;
  referers: Record<string, number>;
  browsers: Record<string, number>;
  devices: Record<string, number>;
  countries: Record<string, number>;
  cities: Record<string, CityRecord>;
};

function emptyBreakdowns(): Breakdowns {
  return { paths: {}, referers: {}, browsers: {}, devices: {}, countries: {}, cities: {} };
}

function addBreakdowns(target: Breakdowns, data: Record<string, any>) {
  mergeCounts(target.paths, data.paths);
  mergeCounts(target.referers, data.referers);
  mergeCounts(target.browsers, data.browsers);
  mergeCounts(target.devices, data.devices);
  mergeCounts(target.countries, data.countries);
  mergeCities(target.cities, data.cities);
  return target;
}

async function safely<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.error('Stats sub-query failed:', error);
    return fallback;
  }
}

async function productStats(db: Firestore): Promise<ProductStats> {
  const [runs, edgecases] = await Promise.all([
    safely(db.collection('runs').count().get().then((s) => s.data().count), 0),
    safely(
      db.collection('edgecases')
        .aggregate({ count: AggregateField.count(), votes: AggregateField.sum('votes') })
        .get()
        .then((s) => s.data()),
      { count: 0, votes: 0 }
    ),
  ]);
  return { runsShared: runs, edgecases: edgecases.count, votes: edgecases.votes ?? 0 };
}

async function recentVisits(db: Firestore, allowedCities: Set<string>): Promise<RecentVisit[]> {
  const snap = await db.collection('visits')
    .orderBy('timestamp', 'desc')
    .limit(RECENT_LIMIT)
    .select('city', 'country', 'location', 'timestamp')
    .get();

  const visits: RecentVisit[] = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    const city = typeof data.city === 'string' ? safeDecode(data.city) : '';
    const lat = data.location?.lat ?? 0;
    const lng = data.location?.lng ?? 0;
    if (!allowedCities.has(city) || (lat === 0 && lng === 0)) continue;
    visits.push({
      id: doc.id,
      city,
      country: typeof data.country === 'string' ? data.country : null,
      lat: roundCoord(lat, 1),
      lng: roundCoord(lng, 1),
      at: (data.timestamp as Timestamp | undefined)?.toMillis() ?? 0,
    });
  }
  return visits.reverse();
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (!applyCors(req, res, ['GET'])) return;

  try {
    const db = getAdminDb();
    const { range, days } = parseRange(req.query.range);
    const globalRef = db.collection('stats').doc('global');
    const today = dateKey(new Date());

    const statsDoc = await globalRef.get();
    if (!statsDoc.exists) {
      return res.status(200).json({ empty: true });
    }

    const data = statsDoc.data() || {};
    const daily: Record<string, number> = data.daily || {};
    const uniqueDaily: Record<string, number> = data.uniqueDaily || {};

    const firstDay = Object.keys(daily).sort()[0] ?? today;
    const spanDays = days ?? daysBetween(firstDay, today);
    const keys = dayKeys(today, spanDays);
    const previousKeys = days ? dayKeys(keys[0], days + 1).slice(0, days) : null;

    const visits = days ? sumDays(daily, keys) : data.totalVisitors || 0;
    const uniqueVisitors = days ? sumDays(uniqueDaily, keys) : data.uniqueVisitors || 0;
    const previousVisits = previousKeys ? sumDays(daily, previousKeys) : null;

    let breakdownScope: StatsResponse['breakdownScope'] = 'all';
    let breakdowns = addBreakdowns(emptyBreakdowns(), data);

    if (days) {
      const daySnap = await globalRef.collection('days')
        .where(FieldPath.documentId(), '>=', keys[0])
        .where(FieldPath.documentId(), '<=', today)
        .get();
      if (!daySnap.empty) {
        breakdownScope = 'range';
        breakdowns = emptyBreakdowns();
        for (const doc of daySnap.docs) addBreakdowns(breakdowns, doc.data());
      }
    }

    const visitorsByCountry = normalizeCountries(breakdowns.countries);
    const cities = publicCities(breakdowns.cities);
    const allowedCities = new Set(publicCities(data.cities, undefined, Infinity).map((c) => c.city));

    const [product, live, recent] = await Promise.all([
      productStats(db),
      safely(liveVisitors(db), 0),
      safely(recentVisits(db, allowedCities), []),
    ]);

    const deviceCategoryData = [
      { name: 'Desktop', value: breakdowns.devices.desktop || 0, fill: '#ffffff' },
      { name: 'Mobile', value: breakdowns.devices.mobile || 0, fill: '#a3a3a3' },
      { name: 'Tablet', value: breakdowns.devices.tablet || 0, fill: '#525252' },
    ].filter((d) => d.value > 0);

    const body: StatsResponse = {
      range,
      breakdownScope,
      visits,
      uniqueVisitors,
      previousVisits,
      growth: computeGrowth(visits, previousVisits),
      allTimeVisits: data.totalVisitors || 0,
      liveVisitors: live,
      visitorsByCountry,
      runsByCountry: normalizeCountries(data.runsByCountry),
      daily: buildSeries(daily, uniqueDaily, keys),
      visitedPagesRows: toRows(breakdowns.paths),
      referrersRows: toRows(breakdowns.referers),
      countriesRows: countryRows(visitorsByCountry),
      browsersRows: toRows(breakdowns.browsers),
      deviceCategoryData,
      cities,
      recentVisits: recent,
      product,
    };

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(body);
  } catch (error) {
    return sendError(res, error, 'Error fetching stats');
  }
}

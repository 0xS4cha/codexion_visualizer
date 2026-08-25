import { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminDb } from './_utils/firebaseAdmin.js';

function unescapeKey(key: string) {
  return key.replace(/_slash_/g, '/').replace(/_/g, '.');
}

function formatBreakdown(obj: Record<string, number> | undefined, limit = 5) {
  if (!obj) return [];
  return Object.entries(obj)
    .map(([key, value]) => ({ label: unescapeKey(key), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const adminDb = getAdminDb();

    const statsDoc = await adminDb.collection('stats').doc('global').get();

    if (!statsDoc.exists) {
      return res.status(200).json({ empty: true });
    }

    const data = statsDoc.data() || {};

    const dailyData = data.daily || {};
    const usersPerDay = Object.keys(dailyData)
      .sort()
      .map(dateStr => ({
        day: dateStr.split('-')[2],
        users: dailyData[dateStr]
      })).slice(-30);

    const deviceData = data.devices || {};
    const deviceCategoryData = [
      { name: "Desktop", value: deviceData.desktop || 0, fill: "#ffffff" },
      { name: "Mobile", value: deviceData.mobile || 0, fill: "#a3a3a3" },
      { name: "Tablet", value: deviceData.tablet || 0, fill: "#525252" },
    ].filter(d => d.value > 0);

    const citiesData = data.cities || {};
    const locations = Object.entries(citiesData).map(([cityStr, details]: [string, any]) => ({
      city: unescapeKey(cityStr),
      lat: details.lat,
      lng: details.lng,
      size: Math.max(2, Math.min(6, Math.ceil(details.count / 10))), // Map count to a dot size between 2 and 6
      count: details.count
    })).sort((a, b) => b.count - a.count).slice(0, 100); // Top 100 cities max

    const countriesData = data.countries || {};
    const formattedCountries: Record<string, number> = {};
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

    for (const [k, v] of Object.entries(countriesData)) {
      const code = unescapeKey(k);
      formattedCountries[code] = v as number;
    }

    const countriesRowsObj: Record<string, number> = {};
    for (const [k, v] of Object.entries(countriesData)) {
      const code = unescapeKey(k);
      try {
        const fullName = regionNames.of(code);
        countriesRowsObj[fullName || code] = v as number;
      } catch (e) {
        countriesRowsObj[code] = v as number;
      }
    }

    return res.status(200).json({
      totalVisitors: data.totalVisitors || 0,
      visitorGrowth: '+0%',
      visitorsByCountry: formattedCountries,
      visitedPagesRows: formatBreakdown(data.paths),
      referrersRows: formatBreakdown(data.referers),
      countriesRows: formatBreakdown(countriesRowsObj),
      browsersRows: formatBreakdown(data.browsers),
      deviceCategoryData,
      usersPerDay,
      locations
    });

  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

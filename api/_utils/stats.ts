import type { CityStat, DailyPoint, StatsRange, StatsRow } from '../../src/types/stats.js';

export const MIN_CITY_VISITS = 3;
export const BREAKDOWN_LIMIT = 50;
export const CITY_LIMIT = 100;

const RANGE_DAYS: Record<StatsRange, number | null> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  all: null,
};

export type CityRecord = { count?: number; lat?: number; lng?: number; country?: string };

export function escapeKey(key: string): string {
  return key.replace(/\./g, '_').replace(/\//g, '_slash_');
}

export function unescapeKey(key: string): string {
  return key.replace(/_slash_/g, '/').replace(/_/g, '.');
}

export function parseRange(raw: unknown): { range: StatsRange; days: number | null } {
  const value = typeof raw === 'string' && raw in RANGE_DAYS ? (raw as StatsRange) : '30d';
  return { range: value, days: RANGE_DAYS[value] };
}

export function dateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function addDays(key: string, delta: number): string {
  const date = new Date(`${key}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return dateKey(date);
}

export function dayKeys(endKey: string, days: number): string[] {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) keys.push(addDays(endKey, -i));
  return keys;
}

export function daysBetween(startKey: string, endKey: string): number {
  const ms = new Date(`${endKey}T00:00:00Z`).getTime() - new Date(`${startKey}T00:00:00Z`).getTime();
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

export function sumDays(daily: Record<string, number>, keys: string[]): number {
  return keys.reduce((acc, key) => acc + (daily[key] ?? 0), 0);
}

export function buildSeries(
  daily: Record<string, number>,
  uniqueDaily: Record<string, number>,
  keys: string[]
): DailyPoint[] {
  return keys.map((date) => ({
    date,
    visits: daily[date] ?? 0,
    uniques: uniqueDaily[date] ?? 0,
  }));
}

export function computeGrowth(current: number, previous: number | null): number | null {
  if (previous === null) return null;
  if (previous === 0) return current > 0 ? null : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function mergeCounts(target: Record<string, number>, source: Record<string, unknown> | undefined) {
  if (!source) return target;
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'number') target[key] = (target[key] ?? 0) + value;
  }
  return target;
}

export function mergeCities(target: Record<string, CityRecord>, source: Record<string, CityRecord> | undefined) {
  if (!source) return target;
  for (const [key, value] of Object.entries(source)) {
    const current = target[key];
    target[key] = {
      count: (current?.count ?? 0) + (value.count ?? 0),
      lat: value.lat ?? current?.lat,
      lng: value.lng ?? current?.lng,
      country: value.country ?? current?.country,
    };
  }
  return target;
}

export function toRows(obj: Record<string, number> | undefined, limit = BREAKDOWN_LIMIT): StatsRow[] {
  if (!obj) return [];
  return Object.entries(obj)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({ label: unescapeKey(key), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function normalizeCountries(obj: Record<string, number> | undefined): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(obj ?? {})) {
    const code = unescapeKey(key).toUpperCase();
    if (!/^[A-Z]{2}$/.test(code) || value <= 0) continue;
    result[code] = (result[code] ?? 0) + value;
  }
  return result;
}

export function countryRows(countries: Record<string, number>, limit = BREAKDOWN_LIMIT): StatsRow[] {
  const names = new Intl.DisplayNames(['en'], { type: 'region' });
  return Object.entries(countries)
    .map(([code, value]) => {
      let label = code;
      try {
        label = names.of(code) ?? code;
      } catch {
        label = code;
      }
      return { label, value, code };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function roundCoord(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function publicCities(
  cities: Record<string, CityRecord> | undefined,
  min = MIN_CITY_VISITS,
  limit = CITY_LIMIT
): CityStat[] {
  return Object.entries(cities ?? {})
    .map(([key, details]) => ({
      city: safeDecode(unescapeKey(key)),
      country: typeof details.country === 'string' ? details.country.toUpperCase() : null,
      lat: roundCoord(details.lat ?? 0, 2),
      lng: roundCoord(details.lng ?? 0, 2),
      count: details.count ?? 0,
    }))
    .filter((c) => c.city !== 'unknown' && c.count >= min && (c.lat !== 0 || c.lng !== 0))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

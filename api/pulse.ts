import { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminDb } from './_utils/firebaseAdmin.js';
import { applyCors, sendError } from './_utils/security.js';
import { liveVisitors } from './_utils/live.js';
import { normalizeCountries } from './_utils/stats.js';
import type { PulseResponse, RepoInfo } from '../src/types/stats.js';

const REPO = '0xS4cha/codexion_visualizer';
const REPO_TTL_MS = 10 * 60 * 1000;

let repoCache: { at: number; value: RepoInfo | null } | null = null;

async function fetchRepo(): Promise<RepoInfo | null> {
  if (repoCache && Date.now() - repoCache.at < REPO_TTL_MS) return repoCache.value;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'codexion-visualizer',
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}`, { headers, signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`GitHub responded ${res.status}`);
    const body = await res.json();
    const value: RepoInfo = { stars: body.stargazers_count ?? 0, pushedAt: body.pushed_at, url: body.html_url };
    repoCache = { at: Date.now(), value };
    return value;
  } catch (error) {
    console.error('GitHub repo fetch failed:', error);
    return repoCache?.value ?? null;
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (!applyCors(req, res, ['GET'])) return;

  try {
    const db = getAdminDb();
    const [statsDoc, live, repo] = await Promise.all([
      db.collection('stats').doc('global').get(),
      liveVisitors(db).catch(() => 0),
      fetchRepo(),
    ]);

    const body: PulseResponse = {
      liveVisitors: live,
      visitorsByCountry: normalizeCountries(statsDoc.data()?.countries),
      repo,
    };

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(body);
  } catch (error) {
    return sendError(res, error, 'Error fetching pulse');
  }
}

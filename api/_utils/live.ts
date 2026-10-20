import { Timestamp } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';

const LIVE_WINDOW_MS = 5 * 60 * 1000;

export async function liveVisitors(db: Firestore): Promise<number> {
  const since = Timestamp.fromMillis(Date.now() - LIVE_WINDOW_MS);
  const snap = await db.collection('visits').where('timestamp', '>=', since).count().get();
  return snap.data().count;
}

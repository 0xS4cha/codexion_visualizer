import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export type edgecaseData = {
  title: string;
  description: string;
  tags: string[];
  command: string;
  instantActionPadding: number;
  dongleCooldown: number;
  output?: string | string[];
  author: string;
  authorUid?: string;
  createdAt: { toMillis?: () => number; seconds?: number } | null;
  votes?: number;
  votedBy?: Record<string, 'up' | 'down'>;
  commentCount?: number;
};

export type EdgecaseComment = {
  id: string;
  author: string;
  text: string;
  createdAt: number | null;
};

export function edgecaseOutputLines(ec: Pick<edgecaseData, 'output'>): string[] {
  if (!ec.output) return [];
  return Array.isArray(ec.output) ? ec.output : ec.output.split('\n');
}

export function edgecaseCreatedAt(ec: Pick<edgecaseData, 'createdAt'>): number {
  const c = ec.createdAt;
  if (!c) return 0;
  if (typeof c.toMillis === 'function') return c.toMillis();
  return (c.seconds ?? 0) * 1000;
}

export const getComments = async (edgecaseId: string): Promise<EdgecaseComment[]> => {
  const res = await fetch(`/api/cases/comments?id=${encodeURIComponent(edgecaseId)}`);
  if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
  const data = (await res.json()) as { comments: EdgecaseComment[] };
  return data.comments ?? [];
};

export const getedgecases = async () => {
  const q = query(collection(db, "edgecases"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as edgecaseData & { id: string }));
};


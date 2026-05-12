import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import { initializeAuth, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
console.log(1);
const app = initializeApp(firebaseConfig);
console.log(2);
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
})
console.log(3);
export const db = getFirestore(app);
console.log(4);
export type EachcaseData = {
  title: string;
  description: string;
  tags: string[];
  command: string;
  instantActionPadding: number;
  dongleCooldown: number;
  output: string;
  author: string;
  authorDisplayName: string;
  createdAt: any;
  votes?: number;
  votedBy?: Record<string, 'up' | 'down'>;
};

export const getEachcases = async () => {
  const q = query(collection(db, "eachcases"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EachcaseData & { id: string }));
};


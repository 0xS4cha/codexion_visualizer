import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getFirebaseAdmin() {
  if (!getApps().length) {
    console.log("Firebase Env Check:", !!process.env.FIREBASE_PROJECT_ID, !!process.env.FIREBASE_PRIVATE_KEY);
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log('Firebase Admin initialized successfully');
  }
}

export const getAdminAuth = () => {
  getFirebaseAdmin();
  return getAuth();
};

export const getAdminDb = () => {
  getFirebaseAdmin();
  return getFirestore();
};
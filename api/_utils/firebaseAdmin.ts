import admin from 'firebase-admin';

function getFirebaseAdmin() {
  if (!admin.apps?.length) {
    console.log("Firebase Env Check:", !!process.env.FIREBASE_PROJECT_ID, !!process.env.FIREBASE_PRIVATE_KEY);
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log('Firebase Admin initialized successfully');
  }
  return admin;
}

export const getAdminAuth = () => getFirebaseAdmin().auth();
export const getAdminDb = () => getFirebaseAdmin().firestore();

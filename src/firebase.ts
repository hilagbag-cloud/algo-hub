import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Configure Firestore with databaseId if present
export const db = firebaseConfig.firestoreDatabaseId
  ? initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

// Helper to ensure user is logged in (returns User if available, or null for guest mode)
export const ensureAuthenticated = async (): Promise<User | null> => {
  if (auth.currentUser) {
    return auth.currentUser;
  }
  return new Promise((resolve) => {
    let resolved = false;

    // Safety timeout in case onAuthStateChanged is slow
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(auth.currentUser);
      }
    }, 1500);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (resolved) return;
      if (user) {
        resolved = true;
        clearTimeout(timer);
        unsubscribe();
        resolve(user);
      } else {
        try {
          const userCredential = await signInAnonymously(auth);
          resolved = true;
          clearTimeout(timer);
          unsubscribe();
          resolve(userCredential.user);
        } catch (error: any) {
          // auth/admin-restricted-operation means anonymous auth is not turned on in Firebase console.
          // We gracefully fall back to unauthenticated/guest state instead of failing.
          resolved = true;
          clearTimeout(timer);
          unsubscribe();
          console.info('Firebase auth: continuing in guest mode (anonymous auth not active):', error?.code || error);
          resolve(null);
        }
      }
    });
  });
};

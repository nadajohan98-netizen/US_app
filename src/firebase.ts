import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);

// experimentalAutoDetectLongPolling helps Firestore keep working behind
// ad blockers / privacy shields / corporate proxies that interfere with the
// streaming WebChannel transport (a common cause of net::ERR_BLOCKED_BY_CLIENT).
export const db = initializeFirestore(
  app,
  { experimentalAutoDetectLongPolling: true },
  firebaseConfig.firestoreDatabaseId
);

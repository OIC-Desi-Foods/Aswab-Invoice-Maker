import { initializeApp } from 'firebase/app';
// FIX: Changed import path to '@firebase/auth' to resolve module name collision.
import { getAuth } from '@firebase/auth';
// FIX: Changed import path to '@firebase/firestore' to resolve module name collision.
import { getFirestore, enableIndexedDbPersistence } from '@firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Replace with your app's Firebase project configuration
// You can get this from the Firebase console for your web app.
const firebaseConfig = {
  apiKey: "AIzaSyDX4K2TA-mGQcvv_ec0de5l31TMEicDcRo",
  authDomain: "aswab-invoice.firebaseapp.com",
  projectId: "aswab-invoice",
  storageBucket: "aswab-invoice.firebasestorage.app",
  messagingSenderId: "552686778835",
  appId: "1:552686778835:web:f752c6a17fe58742d05726"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Enable offline persistence for Firestore
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      // This can happen if you have multiple tabs open.
      console.warn('Firestore persistence failed: multiple tabs open.');
    } else if (err.code == 'unimplemented') {
      // The current browser does not support all of the features required to enable persistence
      console.warn('Firestore persistence not available in this browser.');
    }
  });


export { auth, db, storage };
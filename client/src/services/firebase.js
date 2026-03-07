import { initializeApp } from 'firebase/app';
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth';

const defaultFirebaseConfig = {
    apiKey: 'AIzaSyDRGg4B7AiZHJyAXgor_de7gp1KOmXkvEg',
    authDomain: 'birzha-kanaliv.firebaseapp.com',
    projectId: 'birzha-kanaliv',
    storageBucket: 'birzha-kanaliv.firebasestorage.app',
    messagingSenderId: '318760882241',
    appId: '1:318760882241:web:e1c7b571e75206801676c0',
};

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
};

const missingConfigKeys = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

const canInitializeFirebase = missingConfigKeys.length === 0;
const app = canInitializeFirebase ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const googleProvider = auth ? new GoogleAuthProvider() : null;

if (googleProvider) {
    googleProvider.setCustomParameters({ prompt: 'select_account' });
}

function getFirebaseConfigError() {
    if (missingConfigKeys.length === 0) return null;
    return `Firebase config missing: ${missingConfigKeys.join(', ')}`;
}

export {
    auth,
    googleProvider,
    getFirebaseConfigError,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    onAuthStateChanged,
};

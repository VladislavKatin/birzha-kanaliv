import { initializeApp } from 'firebase/app';
import {
    getAuth,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
} from 'firebase/auth';

const defaultFirebaseConfig = {
    apiKey: 'AIzaSyCvXQGtjivj3p9uC5X4LLffY7sKrjw50Kg',
    authDomain: 'viewexchange-3a790.firebaseapp.com',
    projectId: 'viewexchange-3a790',
    storageBucket: 'viewexchange-3a790.firebasestorage.app',
    messagingSenderId: '608740325704',
    appId: '1:608740325704:web:307ea9a0940f4e0ca75b7d',
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
    onAuthStateChanged,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
};

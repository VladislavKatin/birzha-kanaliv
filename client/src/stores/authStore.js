import { create } from 'zustand';
import {
    auth,
    googleProvider,
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
} from '../services/firebase';
import api from '../services/api';

/**
 * Auth store — replaces AuthContext.
 * Manages Firebase user, backend user sync, YouTube account state.
 */
const useAuthStore = create((set, get) => ({
    // ── State ──────────────────────────────────────────────
    user: null,
    dbUser: null,
    youtubeAccount: null,
    youtubeConnected: false,
    loading: true,
    error: null,

    // ── Internal: sync with backend after Firebase auth ───
    _syncWithBackend: async () => {
        try {
            const response = await api.post('/auth/login', {});
            set({
                dbUser: response.data.user,
                youtubeConnected: response.data.youtubeConnected,
                youtubeAccount: response.data.youtubeAccount,
            });
            return response.data;
        } catch (err) {
            console.error('Backend sync failed:', err);
        }
    },

    // ── Actions ───────────────────────────────────────────

    /** Initialize auth listener — call once on app mount */
    initAuth: () => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            set({ user: firebaseUser });
            if (firebaseUser) {
                await get()._syncWithBackend();
            } else {
                set({
                    dbUser: null,
                    youtubeAccount: null,
                    youtubeConnected: false,
                });
            }
            set({ loading: false });
        });
        return unsubscribe;
    },

    /** Sign in with Google popup */
    signInWithGoogle: async () => {
        set({ error: null });
        try {
            const result = await signInWithPopup(auth, googleProvider);
            await get()._syncWithBackend();
            return result.user;
        } catch (err) {
            const msg = getErrorMessage(err.code);
            set({ error: msg });
            throw err;
        }
    },

    /** Sign out */
    signOut: async () => {
        try {
            await firebaseSignOut(auth);
            set({
                dbUser: null,
                youtubeAccount: null,
                youtubeConnected: false,
            });
        } catch (err) {
            console.error('Sign out error:', err);
            throw err;
        }
    },

    /** Redirect to YouTube OAuth */
    connectYouTube: async () => {
        try {
            const response = await api.get('/youtube/connect');
            window.location.href = response.data.authUrl;
        } catch (err) {
            console.error('YouTube connect error:', err);
            set({ error: 'Не вдалося підключити YouTube' });
        }
    },

    /** Refresh user data from backend */
    refreshUserData: async () => {
        if (get().user) {
            await get()._syncWithBackend();
        }
    },
}));

function getErrorMessage(code) {
    const messages = {
        'auth/popup-closed-by-user': 'Вікно авторизації закрито',
        'auth/network-request-failed': 'Помилка мережі',
        'auth/too-many-requests': 'Забагато спроб. Спробуйте пізніше',
    };
    return messages[code] || 'Сталася помилка. Спробуйте ще раз.';
}

export default useAuthStore;

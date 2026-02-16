import { create } from 'zustand';
import {
    auth,
    googleProvider,
    getFirebaseConfigError,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut as firebaseSignOut,
    onAuthStateChanged,
} from '../services/firebase';
import api from '../services/api';

let redirectResultChecked = false;

const useAuthStore = create((set, get) => ({
    user: null,
    dbUser: null,
    youtubeAccount: null,
    youtubeConnected: false,
    loading: true,
    error: null,

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
            throw err;
        }
    },

    initAuth: () => {
        if (!redirectResultChecked) {
            redirectResultChecked = true;
            getRedirectResult(auth).catch((err) => {
                console.error('Google redirect result error:', err);
                set({ error: getErrorMessage(err?.code) });
            });
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            set({ user: firebaseUser });
            if (firebaseUser) {
                try {
                    await get()._syncWithBackend();
                } catch {
                    set({ error: 'Не вдалося синхронізувати авторизацію з сервером' });
                }
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

    signInWithGoogle: async () => {
        set({ error: null });

        const configError = getFirebaseConfigError();
        if (configError) {
            const message = 'Firebase не налаштований у frontend .env';
            set({ error: `${message}: ${configError}` });
            throw new Error(configError);
        }

        try {
            const result = await signInWithPopup(auth, googleProvider);
            try {
                await get()._syncWithBackend();
            } catch (syncError) {
                const backendError = syncError?.response?.data?.error;
                const status = syncError?.response?.status;
                if (backendError) {
                    set({ error: `Google вхід є, але backend sync не вдався: ${backendError}` });
                } else if (status) {
                    set({ error: `Google вхід є, але backend sync повернув HTTP ${status}` });
                } else {
                    set({ error: 'Google вхід є, але backend sync не вдався' });
                }
                throw syncError;
            }
            return { user: result.user, method: 'popup' };
        } catch (err) {
            const code = String(err?.code || '');

            const shouldFallbackToRedirect = [
                'auth/popup-blocked',
                'auth/cancelled-popup-request',
                'auth/operation-not-supported-in-this-environment',
            ].includes(code);

            if (shouldFallbackToRedirect) {
                try {
                    await signInWithRedirect(auth, googleProvider);
                    return { user: null, method: 'redirect' };
                } catch (redirectError) {
                    console.error('Google redirect sign-in failed:', redirectError);
                    const message = getErrorMessage(redirectError?.code);
                    set({ error: message });
                    throw redirectError;
                }
            }

            const backendError = err?.response?.data?.error;
            if (backendError) {
                set({ error: `Помилка backend: ${backendError}` });
                throw err;
            }

            const message = getErrorMessage(code);
            set({ error: message });
            throw err;
        }
    },

    signOut: async () => {
        try {
            await firebaseSignOut(auth);
            set({
                dbUser: null,
                youtubeAccount: null,
                youtubeConnected: false,
                error: null,
            });
        } catch (err) {
            console.error('Sign out error:', err);
            throw err;
        }
    },

    connectYouTube: async () => {
        try {
            const response = await api.get('/youtube/connect');
            window.location.href = response.data.authUrl;
        } catch (err) {
            console.error('YouTube connect error:', err);
            const backendError = err?.response?.data?.error;
            const message = backendError || 'Не вдалося підключити YouTube. Перевірте авторизацію та налаштування Google OAuth.';
            set({ error: message });
        }
    },

    refreshUserData: async () => {
        if (get().user) {
            await get()._syncWithBackend();
        }
    },
}));

function getErrorMessage(code) {
    const messages = {
        'auth/popup-closed-by-user': 'Вікно входу було закрито. Спробуйте ще раз.',
        'auth/popup-blocked': 'Браузер заблокував popup. Дозвольте popups для цього сайту.',
        'auth/cancelled-popup-request': 'Запит входу скасовано. Спробуйте ще раз.',
        'auth/network-request-failed': 'Помилка мережі під час входу. Перевірте інтернет.',
        'auth/too-many-requests': 'Забагато спроб входу. Спробуйте пізніше.',
        'auth/unauthorized-domain': 'Домен не дозволений у Firebase Auth. Додайте його в Authorized domains.',
        'auth/operation-not-allowed': 'Google Sign-In не увімкнений у Firebase Authentication.',
        'auth/operation-not-supported-in-this-environment': 'Цей режим входу не підтримується в поточному середовищі браузера.',
        'auth/internal-error': 'Внутрішня помилка Firebase Auth. Спробуйте оновити сторінку.',
        'auth/invalid-api-key': 'Невірний Firebase API key у frontend .env',
        'auth/app-not-authorized': 'Цей додаток не авторизований у Firebase проекті',
        'auth/project-not-found': 'Firebase проект не знайдено або вказаний невірний projectId',
        'auth/configuration-not-found': 'Google Sign-In конфігурація не знайдена у Firebase',
    };

    return messages[code] || 'Не вдалося увійти через Google. Спробуйте ще раз.';
}

export default useAuthStore;

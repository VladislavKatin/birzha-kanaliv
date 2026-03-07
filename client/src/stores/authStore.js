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
        const configError = getFirebaseConfigError();
        if (!auth) {
            set({
                user: null,
                dbUser: null,
                youtubeAccount: null,
                youtubeConnected: false,
                loading: false,
                error: configError ? `Firebase не налаштований у frontend .env: ${configError}` : null,
            });
            return () => {};
        }

        if (!redirectResultChecked) {
            redirectResultChecked = true;
            getRedirectResult(auth).catch((err) => {
                console.error('Google redirect result error:', err);
                set({ error: getErrorMessage(err) });
            });
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            set({ user: firebaseUser });
            if (firebaseUser) {
                try {
                    await get()._syncWithBackend();
                } catch (err) {
                    set({ error: getBackendSyncErrorMessage(err) });
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
        if (configError || !auth || !googleProvider) {
            const message = 'Firebase не налаштований у frontend .env';
            const details = configError || 'Missing Firebase auth initialization';
            set({ error: `${message}: ${details}` });
            throw new Error(`${message}: ${details}`);
        }

        try {
            const result = await signInWithPopup(auth, googleProvider);
            try {
                await get()._syncWithBackend();
            } catch (syncError) {
                const backendError = syncError?.response?.data?.error;
                const backendDetails = syncError?.response?.data?.details;
                const status = syncError?.response?.status;
                if (backendError && backendDetails) {
                    const message = `Google вхід є, але backend sync не вдався: ${backendError}: ${backendDetails}`;
                    set({ error: message });
                    throw new Error(message);
                } else if (backendError) {
                    const message = `Google вхід є, але backend sync не вдався: ${backendError}`;
                    set({ error: message });
                    throw new Error(message);
                } else if (status) {
                    const message = `Google вхід є, але backend sync повернув HTTP ${status}`;
                    set({ error: message });
                    throw new Error(message);
                } else {
                    const message = 'Google вхід є, але backend sync не вдався';
                    set({ error: message });
                    throw new Error(message);
                }
            }
            return { user: result.user, method: 'popup' };
        } catch (err) {
            console.error('Google sign-in failed:', err);
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
                    const message = getErrorMessage(redirectError);
                    set({ error: message });
                    throw new Error(message);
                }
            }

            const backendError = err?.response?.data?.error;
            if (backendError) {
                const message = `Помилка backend: ${backendError}`;
                set({ error: message });
                throw new Error(message);
            }

            const message = getErrorMessage(err);
            set({ error: message });
            throw new Error(message);
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

function getErrorMessage(error) {
    const code = String(error?.code || '');
    const rawMessage = String(error?.message || '').trim();
    const normalizedMessage = rawMessage.toLowerCase();
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

    if (messages[code]) {
        return messages[code];
    }

    if (normalizedMessage.includes('unauthorized domain')) {
        return messages['auth/unauthorized-domain'];
    }

    if (normalizedMessage.includes('operation is not allowed')) {
        return messages['auth/operation-not-allowed'];
    }

    if (normalizedMessage.includes('invalid api key')) {
        return messages['auth/invalid-api-key'];
    }

    if (normalizedMessage.includes('project not found')) {
        return messages['auth/project-not-found'];
    }

    if (normalizedMessage.includes('configuration not found')) {
        return messages['auth/configuration-not-found'];
    }

    if (normalizedMessage.includes('network request failed')) {
        return messages['auth/network-request-failed'];
    }

    if (rawMessage) {
        return `Google sign-in error: ${rawMessage}`;
    }

    return 'Не вдалося увійти через Google. Спробуйте ще раз.';
}

function getBackendSyncErrorMessage(error) {
    const backendError = String(error?.response?.data?.error || '').trim();
    const details = String(error?.response?.data?.details || '').trim();
    const status = error?.response?.status;
    const message = String(error?.message || '').trim();

    if (backendError && details) {
        return `${backendError}: ${details}`;
    }

    if (backendError) {
        return backendError;
    }

    if (status) {
        return `Не вдалося синхронізувати авторизацію з сервером (HTTP ${status})`;
    }

    if (message) {
        return message;
    }

    return 'Не вдалося синхронізувати авторизацію з сервером';
}

export default useAuthStore;

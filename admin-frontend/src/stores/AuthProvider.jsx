import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
    googleProvider,
    auth,
    onAuthStateChanged,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    getFirebaseConfigError,
} from '../services/firebase';
import api from '../services/api';

const AuthContext = createContext(null);

let redirectResultChecked = false;

function getErrorMessage(code) {
    const map = {
        'auth/popup-closed-by-user': 'Вікно входу було закрито. Спробуйте ще раз.',
        'auth/popup-blocked': 'Браузер заблокував popup. Дозвольте popups для цього сайту.',
        'auth/cancelled-popup-request': 'Запит входу скасовано. Спробуйте ще раз.',
        'auth/network-request-failed': 'Помилка мережі під час входу.',
        'auth/unauthorized-domain': 'Домен не дозволений у Firebase Auth (Authorized domains).',
        'auth/operation-not-allowed': 'Google Sign-In вимкнено у Firebase Authentication.',
        'auth/operation-not-supported-in-this-environment': 'Поточний браузер блокує popup-вхід. Використайте redirect.',
        'auth/invalid-api-key': 'Невірний Firebase API key.',
        'auth/configuration-not-found': 'Google auth конфігурація не знайдена у Firebase.',
    };
    return map[code] || 'Не вдалося увійти через Google';
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [dbUser, setDbUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    async function syncWithBackend() {
        const response = await api.post('/auth/login', {});
        setDbUser(response.data.user || null);
        return response.data;
    }

    useEffect(() => {
        if (!redirectResultChecked) {
            redirectResultChecked = true;
            getRedirectResult(auth).catch((err) => {
                setError(getErrorMessage(err?.code));
            });
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (!firebaseUser) {
                setDbUser(null);
                setLoading(false);
                return;
            }

            try {
                await syncWithBackend();
            } catch (err) {
                setDbUser(null);
                const backendError = err?.response?.data?.error;
                if (backendError) {
                    setError(`Помилка backend: ${backendError}`);
                } else {
                    setError('Google вхід є, але backend sync не вдався');
                }
            } finally {
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const value = useMemo(() => ({
        user,
        dbUser,
        loading,
        error,
        isAdmin: dbUser?.role === 'admin',
        signInWithGoogle: async () => {
            setError('');
            const configError = getFirebaseConfigError();
            if (configError) {
                setError(`Firebase не налаштований: ${configError}`);
                throw new Error(configError);
            }

            try {
                await signInWithPopup(auth, googleProvider);
                await syncWithBackend();
                return { method: 'popup' };
            } catch (err) {
                const code = String(err?.code || '');

                if (['auth/popup-blocked', 'auth/cancelled-popup-request', 'auth/operation-not-supported-in-this-environment'].includes(code)) {
                    try {
                        await signInWithRedirect(auth, googleProvider);
                        return { method: 'redirect' };
                    } catch (redirectError) {
                        setError(getErrorMessage(redirectError?.code));
                        throw redirectError;
                    }
                }

                const backendError = err?.response?.data?.error;
                if (backendError) {
                    setError(`Помилка backend: ${backendError}`);
                } else {
                    setError(getErrorMessage(code));
                }
                throw err;
            }
        },
        signOut: async () => {
            await signOut(auth);
            setError('');
        },
        refreshProfile: async () => {
            if (!auth.currentUser) {
                setDbUser(null);
                return;
            }
            await syncWithBackend();
        },
    }), [user, dbUser, loading, error]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used inside AuthProvider');
    }
    return ctx;
}

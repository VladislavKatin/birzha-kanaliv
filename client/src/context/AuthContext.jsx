/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import {
    auth,
    googleProvider,
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
} from '../services/firebase';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [dbUser, setDbUser] = useState(null);
    const [youtubeAccount, setYoutubeAccount] = useState(null);
    const [youtubeConnected, setYoutubeConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    async function syncWithBackend() {
        try {
            const response = await api.post('/auth/login', {});
            setDbUser(response.data.user);
            setYoutubeConnected(response.data.youtubeConnected);
            setYoutubeAccount(response.data.youtubeAccount);
            return response.data;
        } catch (err) {
            console.error('Backend sync failed:', err);
            return null;
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                await syncWithBackend();
            } else {
                setDbUser(null);
                setYoutubeAccount(null);
                setYoutubeConnected(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    async function signInWithGoogle() {
        setError(null);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            await syncWithBackend();
            return result.user;
        } catch (err) {
            setError(getErrorMessage(err.code));
            throw err;
        }
    }

    async function signOut() {
        try {
            await firebaseSignOut(auth);
            setDbUser(null);
            setYoutubeAccount(null);
            setYoutubeConnected(false);
        } catch (err) {
            console.error('Sign out error:', err);
            throw err;
        }
    }

    async function connectYouTube() {
        try {
            const response = await api.get('/youtube/connect');
            window.location.href = response.data.authUrl;
        } catch (err) {
            console.error('YouTube connect error:', err);
            setError('Не вдалося підключити YouTube');
        }
    }

    async function refreshUserData() {
        if (user) {
            await syncWithBackend();
        }
    }

    function getErrorMessage(code) {
        const messages = {
            'auth/popup-closed-by-user': 'Вікно авторизації закрито',
            'auth/network-request-failed': 'Помилка мережі',
            'auth/too-many-requests': 'Забагато спроб. Спробуйте пізніше',
        };

        return messages[code] || 'Сталася помилка. Спробуйте ще раз.';
    }

    const value = {
        user,
        dbUser,
        youtubeAccount,
        youtubeConnected,
        loading,
        error,
        signInWithGoogle,
        signOut,
        connectYouTube,
        refreshUserData,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { googleProvider, auth, onAuthStateChanged, signInWithPopup, signOut } from '../services/firebase';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [dbUser, setDbUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (!firebaseUser) {
                setDbUser(null);
                setLoading(false);
                return;
            }

            try {
                const response = await api.post('/auth/login', {});
                setDbUser(response.data.user || null);
            } catch {
                setDbUser(null);
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
        isAdmin: dbUser?.role === 'admin',
        signInWithGoogle: async () => {
            await signInWithPopup(auth, googleProvider);
        },
        signOut: async () => {
            await signOut(auth);
        },
        refreshProfile: async () => {
            if (!auth.currentUser) {
                setDbUser(null);
                return;
            }
            const response = await api.post('/auth/login', {});
            setDbUser(response.data.user || null);
        },
    }), [user, dbUser, loading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used inside AuthProvider');
    }
    return ctx;
}

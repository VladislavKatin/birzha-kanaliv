import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import { resolvePostAuthPath } from '../../services/navigation';
import { applyPageSeo } from '../../services/seo';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';
import './AuthPage.css';

export default function AuthPage() {
    const { user, dbUser, signInWithGoogle, loading, error } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    const nextPath = resolvePostAuthPath(location.search, '/dashboard');

    useEffect(() => {
        applyPageSeo({
            title: 'Вхід — Біржа Каналів',
            description: 'Увійдіть до Біржа Каналів через Google, щоб керувати каналами та обмінами.',
            path: '/auth',
            robots: 'noindex,nofollow',
        });
    }, []);

    useEffect(() => {
        if (!loading && dbUser) {
            navigate(nextPath, { replace: true });
        }
    }, [loading, dbUser, navigate, nextPath]);

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            const result = await signInWithGoogle();
            if (result?.method === 'popup') {
                navigate(nextPath);
            }
        } catch (signInError) {
            toast.error(signInError?.message || error || 'Не вдалося увійти через Google');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-bg-gradient" />
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo">
                            <span className="auth-logo-icon">▶</span>
                        </div>
                        <h1 className="auth-title">Біржа Каналів</h1>
                        <p className="auth-subtitle">
                            Платформа для обміну аудиторією між YouTube-каналами
                        </p>
                    </div>

                    <div className="auth-actions">
                        <GoogleLoginButton onClick={handleGoogleSignIn} loading={isLoading} disabled={!!user} />
                    </div>

                    {error && <p className="auth-error">{error}</p>}

                    <p className="auth-footer-text">
                        Натискаючи «Увійти», ви погоджуєтесь з умовами використання
                    </p>
                </div>
            </div>
        </div>
    );
}

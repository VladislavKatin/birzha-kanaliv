import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../stores/AuthProvider';

export default function AuthPage() {
    const navigate = useNavigate();
    const { signInWithGoogle, refreshProfile, error } = useAuth();

    async function handleLogin() {
        try {
            const result = await signInWithGoogle();
            if (result?.method === 'popup') {
                await refreshProfile();
                navigate('/dashboard');
            }
        } catch {
            toast.error('Не вдалося увійти через Google');
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1>Admin Console</h1>
                <p>Окремий вхід в адмін-панель управління сервісом.</p>
                <button className="btn btn-primary" onClick={handleLogin}>Увійти через Google</button>
                {error ? <p className="error-text">{error}</p> : null}
            </div>
        </div>
    );
}

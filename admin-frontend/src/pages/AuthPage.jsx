import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../stores/AuthProvider';

export default function AuthPage() {
    const navigate = useNavigate();
    const { signInWithGoogle, refreshProfile } = useAuth();

    async function handleLogin() {
        try {
            await signInWithGoogle();
            await refreshProfile();
            navigate('/dashboard');
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
            </div>
        </div>
    );
}

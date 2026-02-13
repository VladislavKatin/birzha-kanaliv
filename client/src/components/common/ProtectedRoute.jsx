import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

export default function ProtectedRoute() {
    const { user, loading } = useAuthStore();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: 'var(--surface-0)',
            }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    return user ? <Outlet /> : <Navigate to="/auth" replace />;
}

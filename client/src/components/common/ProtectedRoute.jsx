import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { buildAuthRedirectPath } from '../../services/navigation';

export default function ProtectedRoute() {
    const { user, loading } = useAuthStore();
    const location = useLocation();

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

    if (user) {
        return <Outlet />;
    }

    const targetPath = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={buildAuthRedirectPath(targetPath)} replace />;
}

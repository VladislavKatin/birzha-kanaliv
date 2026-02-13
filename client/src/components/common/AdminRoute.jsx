import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

export default function AdminRoute() {
    const { loading, dbUser } = useAuthStore();

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-pulse" />
                <p>Завантаження...</p>
            </div>
        );
    }

    if (dbUser?.role === 'admin') {
        return <Outlet />;
    }

    return <Navigate to="/dashboard" replace />;
}

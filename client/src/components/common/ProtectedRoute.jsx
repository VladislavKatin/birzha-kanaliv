import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { buildAuthRedirectPath } from '../../services/navigation';

export default function ProtectedRoute() {
    const { user, dbUser, loading, error, refreshUserData, signOut } = useAuthStore();
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
        if (!dbUser) {
            return (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    background: 'var(--surface-0)',
                    padding: '24px',
                }}>
                    <div className="card" style={{ maxWidth: '520px', width: '100%', textAlign: 'center' }}>
                        <h2>Не вдалося завершити авторизацію</h2>
                        <p>{error || 'Не вдалося синхронізувати вхід з сервером. Спробуйте ще раз.'}</p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button className="btn btn-primary btn-sm" onClick={() => refreshUserData()}>
                                Повторити
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => signOut()}>
                                Вийти
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return <Outlet />;
    }

    const targetPath = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={buildAuthRedirectPath(targetPath)} replace />;
}

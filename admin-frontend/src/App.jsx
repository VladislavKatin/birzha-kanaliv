import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './stores/AuthProvider';
import AdminLayout from './layout/AdminLayout';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import SupportPage from './pages/SupportPage';

function LoadingScreen() {
    return <div className="app-loader">Завантаження...</div>;
}

function ProtectedRoute() {
    const { loading, user, isAdmin } = useAuth();

    if (loading) return <LoadingScreen />;
    if (!user) return <Navigate to="/auth" replace />;
    if (!isAdmin) return <Navigate to="/auth?forbidden=1" replace />;
    return <AdminLayout />;
}

function AppRoutes() {
    const { loading, user, isAdmin } = useAuth();

    if (loading) return <LoadingScreen />;

    return (
        <Routes>
            <Route
                path="/auth"
                element={user && isAdmin ? <Navigate to="/dashboard" replace /> : <AuthPage />}
            />
            <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/support" element={<SupportPage />} />
            </Route>
            <Route path="*" element={<Navigate to={user && isAdmin ? '/dashboard' : '/auth'} replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}

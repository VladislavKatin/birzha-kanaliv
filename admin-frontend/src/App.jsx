import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './stores/AuthProvider';
import AdminLayout from './layout/AdminLayout';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import SupportPage from './pages/SupportPage';
import ChannelsPage from './pages/ChannelsPage';
import OffersModerationPage from './pages/OffersModerationPage';
import MatchesPage from './pages/MatchesPage';
import ExchangeHistoryPage from './pages/ExchangeHistoryPage';
import SystemInsightsPage from './pages/SystemInsightsPage';
import IncidentsPage from './pages/IncidentsPage';
import DemoContentPage from './pages/DemoContentPage';

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
                <Route path="/channels" element={<ChannelsPage />} />
                <Route path="/offers" element={<OffersModerationPage />} />
                <Route path="/matches" element={<MatchesPage />} />
                <Route path="/history" element={<ExchangeHistoryPage />} />
                <Route path="/system" element={<SystemInsightsPage />} />
                <Route path="/incidents" element={<IncidentsPage />} />
                <Route path="/demo-content" element={<DemoContentPage />} />
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

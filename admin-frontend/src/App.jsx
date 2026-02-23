import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './stores/AuthProvider';
import AdminLayout from './layout/AdminLayout';

const AuthPage = lazy(() => import('./pages/AuthPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const ChannelsPage = lazy(() => import('./pages/ChannelsPage'));
const OffersModerationPage = lazy(() => import('./pages/OffersModerationPage'));
const MatchesPage = lazy(() => import('./pages/MatchesPage'));
const ExchangeHistoryPage = lazy(() => import('./pages/ExchangeHistoryPage'));
const SystemInsightsPage = lazy(() => import('./pages/SystemInsightsPage'));
const IncidentsPage = lazy(() => import('./pages/IncidentsPage'));
const DemoContentPage = lazy(() => import('./pages/DemoContentPage'));

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
        <Suspense fallback={<LoadingScreen />}>
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
        </Suspense>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}

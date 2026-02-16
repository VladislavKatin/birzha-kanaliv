import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './stores/authStore';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import DashboardLayout from './components/layout/DashboardLayout';

const HomePage = lazy(() => import('./pages/public/HomePage'));
const BlogListPage = lazy(() => import('./pages/public/BlogListPage'));
const BlogArticlePage = lazy(() => import('./pages/public/BlogArticlePage'));
const FaqPage = lazy(() => import('./pages/public/FaqPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/public/PrivacyPolicyPage'));
const OffersCatalogPage = lazy(() => import('./pages/public/OffersCatalogPage'));
const OfferDetailsPage = lazy(() => import('./pages/public/OfferDetailsPage'));
const NotFoundPage = lazy(() => import('./pages/public/NotFoundPage'));
const AuthPage = lazy(() => import('./pages/auth/AuthPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const MyChannelsPage = lazy(() => import('./pages/channels/MyChannelsPage'));
const ChannelDetailPage = lazy(() => import('./pages/channels/ChannelDetailPage'));
const IncomingSwapsPage = lazy(() => import('./pages/swaps/IncomingSwapsPage'));
const OutgoingSwapsPage = lazy(() => import('./pages/swaps/OutgoingSwapsPage'));
const ExchangesPage = lazy(() => import('./pages/exchanges/ExchangesPage'));
const OffersPage = lazy(() => import('./pages/offers/OffersPage'));
const PublicProfilePage = lazy(() => import('./pages/profile/PublicProfilePage'));
const EditProfilePage = lazy(() => import('./pages/profile/EditProfilePage'));
const NotificationSettingsPage = lazy(() => import('./pages/settings/NotificationSettingsPage'));
const SupportChatsPage = lazy(() => import('./pages/support/SupportChatsPage'));
const AdminControlCenterPage = lazy(() => import('./pages/admin/AdminControlCenterPage'));

function AuthInit({ children }) {
    const initAuth = useAuthStore((state) => state.initAuth);

    useEffect(() => {
        const unsub = initAuth();
        return () => unsub();
    }, [initAuth]);

    return children;
}

function PageFallback() {
    return (
        <div className="dashboard-loading">
            <div className="loading-pulse" />
            <p>Завантаження сторінки...</p>
        </div>
    );
}

function LegacyChatRedirect() {
    const { transactionId } = useParams();
    const threadId = transactionId ? `match-${transactionId}` : 'support';
    return <Navigate to={`/support/chats?thread=${threadId}`} replace />;
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthInit>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: 'var(--surface-2)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '14px',
                        },
                    }}
                />
                <Suspense fallback={<PageFallback />}>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/offers" element={<OffersCatalogPage />} />
                        <Route path="/offers/:offerId" element={<OfferDetailsPage />} />
                        <Route path="/blog" element={<BlogListPage />} />
                        <Route path="/blog/:slug" element={<BlogArticlePage />} />
                        <Route path="/faq" element={<FaqPage />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                        <Route path="/auth" element={<AuthPage />} />

                        <Route element={<ProtectedRoute />}>
                            <Route element={<DashboardLayout />}>
                                <Route path="/dashboard" element={<DashboardPage />} />
                                <Route path="/my-channels" element={<MyChannelsPage />} />
                                <Route path="/my-channels/:id" element={<ChannelDetailPage />} />
                                <Route path="/dashboard/offers" element={<OffersPage />} />
                                <Route path="/swaps/incoming" element={<IncomingSwapsPage />} />
                                <Route path="/swaps/outgoing" element={<OutgoingSwapsPage />} />
                                <Route path="/exchanges" element={<ExchangesPage />} />
                                <Route path="/profile/:userId" element={<PublicProfilePage />} />
                                <Route path="/profile/edit" element={<EditProfilePage />} />
                                <Route path="/settings/notifications" element={<NotificationSettingsPage />} />
                                <Route path="/support/chats" element={<SupportChatsPage />} />
                                <Route element={<AdminRoute />}>
                                    <Route path="/admin" element={<AdminControlCenterPage />} />
                                    <Route path="/dashboard/admin" element={<AdminControlCenterPage />} />
                                </Route>
                            </Route>
                            <Route path="/chat/:transactionId" element={<LegacyChatRedirect />} />
                        </Route>
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </Suspense>
            </AuthInit>
        </BrowserRouter>
    );
}

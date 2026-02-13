import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './stores/authStore';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import HomePage from './pages/public/HomePage';
import BlogListPage from './pages/public/BlogListPage';
import BlogArticlePage from './pages/public/BlogArticlePage';
import FaqPage from './pages/public/FaqPage';
import OffersCatalogPage from './pages/public/OffersCatalogPage';
import OfferDetailsPage from './pages/public/OfferDetailsPage';
import AuthPage from './pages/auth/AuthPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import MyChannelsPage from './pages/channels/MyChannelsPage';
import ChannelDetailPage from './pages/channels/ChannelDetailPage';
import IncomingSwapsPage from './pages/swaps/IncomingSwapsPage';
import OutgoingSwapsPage from './pages/swaps/OutgoingSwapsPage';
import ExchangesPage from './pages/exchanges/ExchangesPage';
import OffersPage from './pages/offers/OffersPage';
import ChatPage from './pages/chat/ChatPage';
import PublicProfilePage from './pages/profile/PublicProfilePage';
import EditProfilePage from './pages/profile/EditProfilePage';
import NotificationSettingsPage from './pages/settings/NotificationSettingsPage';
import SupportChatsPage from './pages/support/SupportChatsPage';
import AdminControlCenterPage from './pages/admin/AdminControlCenterPage';

function AuthInit({ children }) {
    const initAuth = useAuthStore((state) => state.initAuth);

    useEffect(() => {
        const unsub = initAuth();
        return () => unsub();
    }, [initAuth]);

    return children;
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
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/offers" element={<OffersCatalogPage />} />
                    <Route path="/offers/:offerId" element={<OfferDetailsPage />} />
                    <Route path="/blog" element={<BlogListPage />} />
                    <Route path="/blog/:slug" element={<BlogArticlePage />} />
                    <Route path="/faq" element={<FaqPage />} />
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
                            </Route>
                        </Route>
                        <Route path="/chat/:transactionId" element={<ChatPage />} />
                    </Route>
                </Routes>
            </AuthInit>
        </BrowserRouter>
    );
}

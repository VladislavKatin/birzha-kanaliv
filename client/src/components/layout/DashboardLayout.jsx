import { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import useGlobalSocket from '../../hooks/useGlobalSocket';
import api from '../../services/api';
import { buildNotificationKey, formatToastMessage } from '../../services/globalNotifications';
import { computeMenuBadgeCounts } from '../../services/menuBadges';
import Icon from '../common/Icon';
import './DashboardLayout.css';

const navItems = [
    { path: '/dashboard', label: 'Дашборд', description: 'Загальна статистика акаунта', icon: 'dashboard' },
    { path: '/my-channels', label: 'Мої канали', description: 'Керування та синхронізація каналів', icon: 'youtube' },
    { path: '/dashboard/offers', label: 'Пропозиції', description: 'Каталог активних каналів для обміну', icon: 'search' },
    { path: '/swaps/incoming', label: 'Вхідні запити', description: 'Нові запити від інших каналів', icon: 'messages' },
    { path: '/swaps/outgoing', label: 'Вихідні запити', description: 'Ваші надіслані пропозиції', icon: 'message' },
    { path: '/exchanges', label: 'Обміни', description: 'Активні угоди та їх статус', icon: 'handshake' },
    { path: '/support/chats', label: 'Повідомлення', description: 'Чати користувачів і підтримка', icon: 'messages' },
    { path: '/profile/edit', label: 'Профіль', description: 'Редагування інформації про вас', icon: 'user' },
    { path: '/settings/notifications', label: 'Сповіщення', description: 'Канали отримання сповіщень', icon: 'bell' },
];

const topLinks = [
    { to: '/faq', label: 'FAQ' },
    { to: '/support/chats', label: 'Знайшли помилку' },
];

export default function DashboardLayout() {
    const { user, dbUser, signOut } = useAuthStore();
    const { connected, notifications, onlineUsers, clearNotification, clearAllNotifications } = useGlobalSocket();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [menuBadges, setMenuBadges] = useState({ incoming: 0, outgoing: 0, messages: 0 });
    const [adminMenuBadges, setAdminMenuBadges] = useState({ newSupportMessages: 0 });
    const menuThreadsRef = useRef([]);
    const badgesRequestInFlightRef = useRef(false);
    const lastMenuBadgesLoadAtRef = useRef(0);
    const seenNotificationKeysRef = useRef(new Set());
    const visibleNavItems = dbUser?.role === 'admin'
        ? [{ path: '/admin', label: 'Адмінка', description: 'Управління платформою', icon: 'settings' }, ...navItems]
        : navItems;

    const getBadgeCountByPath = (path) => {
        if (path === '/swaps/incoming') return menuBadges.incoming;
        if (path === '/swaps/outgoing') return menuBadges.outgoing;
        if (path === '/support/chats') return menuBadges.messages;
        if (path === '/admin' || path === '/dashboard/admin') return adminMenuBadges.newSupportMessages || 0;
        return 0;
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/auth');
    };

    useEffect(() => {
        notifications.forEach((notification, index) => {
            const key = buildNotificationKey(notification, index);
            if (!key || seenNotificationKeysRef.current.has(key)) {
                return;
            }

            seenNotificationKeysRef.current.add(key);
            const message = formatToastMessage(notification);
            if (message) {
                toast(message);
            }
        });
    }, [notifications]);

    useEffect(() => {
        let cancelled = false;

        async function loadMenuBadges() {
            if (!dbUser) {
                if (!cancelled) {
                    setMenuBadges({ incoming: 0, outgoing: 0, messages: 0 });
                }
                return;
            }
            if (document.hidden || badgesRequestInFlightRef.current) {
                return;
            }

            try {
                badgesRequestInFlightRef.current = true;
                const response = await api.get('/user/menu-badges');
                const messageThreads = response.data?.messageThreads || [];

                const counts = computeMenuBadgeCounts({
                    incomingCount: response.data?.incoming,
                    outgoingCount: response.data?.outgoing,
                    messageThreads,
                }, {
                    myUserId: response.data?.myUserId || dbUser.id || '',
                });

                if (!cancelled) {
                    menuThreadsRef.current = messageThreads;
                    setMenuBadges(counts);
                    lastMenuBadgesLoadAtRef.current = Date.now();
                }
            } catch (error) {
                console.error('Failed to load menu badges:', error);
            } finally {
                badgesRequestInFlightRef.current = false;
            }
        }

        loadMenuBadges();
        const intervalId = setInterval(loadMenuBadges, 90000);
        const handleVisibilityChange = () => {
            if (!document.hidden && Date.now() - lastMenuBadgesLoadAtRef.current > 45000) {
                loadMenuBadges();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            cancelled = true;
            clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [dbUser]);

    useEffect(() => {
        if (dbUser?.role !== 'admin') {
            setAdminMenuBadges({ newSupportMessages: 0 });
            return;
        }

        let cancelled = false;

        async function loadAdminMenuBadges() {
            try {
                const response = await api.get('/admin/menu-badges');
                if (!cancelled) {
                    setAdminMenuBadges({
                        newSupportMessages: Number(response.data?.newSupportMessages || 0),
                    });
                }
            } catch (error) {
                console.error('Failed to load admin menu badges:', error);
                if (!cancelled) {
                    setAdminMenuBadges({ newSupportMessages: 0 });
                }
            }
        }

        loadAdminMenuBadges();
        const intervalId = setInterval(loadAdminMenuBadges, 60000);

        return () => {
            cancelled = true;
            clearInterval(intervalId);
        };
    }, [dbUser?.role]);

    useEffect(() => {
        if (dbUser?.role !== 'admin') return;
        if (location.pathname !== '/admin' && location.pathname !== '/dashboard/admin') return;

        let cancelled = false;

        async function markSupportSeen() {
            try {
                await api.post('/admin/menu-badges/seen', { scope: 'support' });
            } catch (error) {
                console.error('Failed to mark support admin badge as seen:', error);
            } finally {
                if (!cancelled) {
                    setAdminMenuBadges({ newSupportMessages: 0 });
                }
            }
        }

        markSupportSeen();

        return () => {
            cancelled = true;
        };
    }, [dbUser?.role, location.pathname]);

    useEffect(() => {
        if (dbUser?.role !== 'admin') return;

        function handleSupportMessage(event) {
            const incoming = event.detail;
            if (!incoming?.id) return;
            if (location.pathname === '/admin' || location.pathname === '/dashboard/admin') return;
            if (incoming.isAdmin) return;

            setAdminMenuBadges((prev) => ({
                newSupportMessages: Number(prev?.newSupportMessages || 0) + 1,
            }));
        }

        window.addEventListener('support:message', handleSupportMessage);
        return () => window.removeEventListener('support:message', handleSupportMessage);
    }, [dbUser?.role, location.pathname]);

    return (
        <div className="dashboard-layout">
            {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <Link to="/" className="sidebar-logo" onClick={() => setSidebarOpen(false)} aria-label="Перейти на лендинг">
                        <span className="logo-icon" aria-hidden="true">
                            <Icon name="youtube" size={18} />
                        </span>
                        <span className="logo-text">Біржа Каналів</span>
                    </Link>
                </div>

                <nav className="sidebar-nav">
                    {visibleNavItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className="nav-icon">
                                <Icon name={item.icon} size={18} />
                            </span>
                            <span className="nav-text">
                                <span className="nav-label">{item.label}</span>
                                <span className="nav-desc">{item.description}</span>
                            </span>
                            {getBadgeCountByPath(item.path) > 0 && (
                                <span className="nav-badge">{getBadgeCountByPath(item.path)}</span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <img
                            src={user?.photoURL || `https://ui-avatars.com/api/?name=${dbUser?.displayName || 'U'}&background=005bbb&color=fff`}
                            alt="Avatar"
                            className="user-avatar"
                        />
                        <div className="user-details">
                            <span className="user-name">{dbUser?.displayName || user?.email || 'Користувач'}</span>
                            <span className="user-email">{user?.email}</span>
                        </div>
                    </div>
                    <button className="btn-logout" onClick={handleSignOut} title="Вийти" aria-label="Вийти">
                        <Icon name="logout" size={18} />
                    </button>
                </div>
            </aside>

            <div className="main-area">
                <header className="topbar">
                    <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Меню">
                        <Icon name="filter" size={18} />
                    </button>

                    <div className="topbar-links" aria-label="Швидка навігація">
                        {topLinks.map((item) => (
                            <Link key={item.to} to={item.to} className="topbar-link">
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    <div className="topbar-right">
                        <button
                            className={`notifications-btn ${notifications.length > 0 ? 'has-items' : ''}`}
                            onClick={() => setNotificationsOpen((open) => !open)}
                            title="Сповіщення"
                            aria-label="Сповіщення"
                        >
                            <Icon name="bell" size={16} />
                            {notifications.length > 0 && <span className="notifications-count">{notifications.length}</span>}
                        </button>

                        {notificationsOpen && (
                            <div className="notifications-panel">
                                <div className="notifications-panel-header">
                                    <strong>Сповіщення</strong>
                                    {notifications.length > 0 && (
                                        <button className="notifications-clear-all" onClick={clearAllNotifications}>
                                            Очистити все
                                        </button>
                                    )}
                                </div>

                                <div className="notifications-panel-meta">
                                    <span>Socket: {connected ? 'онлайн' : 'офлайн'}</span>
                                    <span>Онлайн: {onlineUsers.length}</span>
                                </div>

                                {notifications.length === 0 ? (
                                    <div className="notifications-empty">Наразі сповіщень немає</div>
                                ) : (
                                    <div className="notifications-list">
                                        {notifications.map((notification, index) => (
                                            <button
                                                key={buildNotificationKey(notification, index) || index}
                                                className="notification-item"
                                                onClick={() => {
                                                    if (notification.link) {
                                                        navigate(notification.link);
                                                    }
                                                    clearNotification(index);
                                                    setNotificationsOpen(false);
                                                }}
                                            >
                                                <span className="notification-title">{notification.title || 'Сповіщення'}</span>
                                                {notification.message && <span className="notification-message">{notification.message}</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <span className="topbar-greeting">
                            Вітаю, <strong>{dbUser?.displayName || 'Користувач'}</strong>
                        </span>
                    </div>
                </header>

                <main className="main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

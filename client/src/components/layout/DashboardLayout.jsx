import { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import useGlobalSocket from '../../hooks/useGlobalSocket';
import { buildNotificationKey, formatToastMessage } from '../../services/globalNotifications';
import Icon from '../common/Icon';
import './DashboardLayout.css';

const navItems = [
    { path: '/dashboard', label: 'Дашборд', icon: 'dashboard' },
    { path: '/my-channels', label: 'Мої канали', icon: 'youtube' },
    { path: '/dashboard/offers', label: 'Пропозиції', icon: 'search' },
    { path: '/swaps/incoming', label: 'Вхідні запити', icon: 'messages' },
    { path: '/swaps/outgoing', label: 'Вихідні запити', icon: 'message' },
    { path: '/exchanges', label: 'Обміни', icon: 'handshake' },
    { path: '/profile/edit', label: 'Профіль', icon: 'user' },
    { path: '/settings/notifications', label: 'Сповіщення', icon: 'bell' },
];

export default function DashboardLayout() {
    const { user, dbUser, signOut } = useAuthStore();
    const { connected, notifications, onlineUsers, clearNotification, clearAllNotifications } = useGlobalSocket();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const seenNotificationKeysRef = useRef(new Set());

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

    return (
        <div className="dashboard-layout">
            {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <span className="logo-icon" aria-hidden="true">
                            <Icon name="youtube" size={18} />
                        </span>
                        <span className="logo-text">Біржа Каналів</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className="nav-icon">
                                <Icon name={item.icon} size={18} />
                            </span>
                            <span className="nav-label">{item.label}</span>
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

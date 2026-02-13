import { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import useGlobalSocket from '../../hooks/useGlobalSocket';
import { buildNotificationKey, formatToastMessage } from '../../services/globalNotifications';
import Icon from '../common/Icon';
import './DashboardLayout.css';

const navItems = [
    { path: '/dashboard', label: 'Дашборд', description: 'Загальна статистика акаунта', icon: 'dashboard' },
    { path: '/my-channels', label: 'Мої канали', description: 'Керування та синхронізація каналів', icon: 'youtube' },
    { path: '/dashboard/offers', label: 'Пропозиції', description: 'Каталог і створення обмінів', icon: 'search' },
    { path: '/swaps/incoming', label: 'Вхідні запити', description: 'Нові запити від інших каналів', icon: 'messages' },
    { path: '/swaps/outgoing', label: 'Вихідні запити', description: 'Ваші надіслані пропозиції', icon: 'message' },
    { path: '/exchanges', label: 'Обміни', description: 'Активні угоди та їх статус', icon: 'handshake' },
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
                    <Link to="/" className="sidebar-logo" onClick={() => setSidebarOpen(false)} aria-label="Перейти на лендинг">
                        <span className="logo-icon" aria-hidden="true">
                            <Icon name="youtube" size={18} />
                        </span>
                        <span className="logo-text">Біржа Каналів</span>
                    </Link>
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
                            <span className="nav-text">
                                <span className="nav-label">{item.label}</span>
                                <span className="nav-desc">{item.description}</span>
                            </span>
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
                        <button className="topbar-link topbar-link-disabled" type="button" disabled title="Скоро буде доступно">
                            Чат з розробниками (незабаром)
                        </button>
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

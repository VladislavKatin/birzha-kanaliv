import { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import useGlobalSocket from '../../hooks/useGlobalSocket';
import { buildNotificationKey, formatToastMessage } from '../../services/globalNotifications';
import './DashboardLayout.css';

const navItems = [
    { path: '/dashboard', label: 'Р”Р°С€Р±РѕСЂРґ', icon: 'рџЏ ' },
    { path: '/my-channels', label: 'РњРѕС— РєР°РЅР°Р»Рё', icon: 'рџ“є' },
    { path: '/dashboard/offers', label: 'РџСЂРѕРїРѕР·РёС†С–С—', icon: 'рџ”Ќ' },
    { path: '/swaps/incoming', label: 'Р’С…С–РґРЅС–', icon: 'рџ“Ґ' },
    { path: '/swaps/outgoing', label: 'Р’РёС…С–РґРЅС–', icon: 'рџ“¤' },
    { path: '/exchanges', label: 'РћР±РјС–РЅРё', icon: 'рџ¤ќ' },
    { path: '/profile/edit', label: 'РџСЂРѕС„С–Р»СЊ', icon: 'рџ‘¤' },
    { path: '/settings/notifications', label: 'РЎРїРѕРІС–С‰РµРЅРЅСЏ', icon: 'рџ””' },
];

export default function DashboardLayout() {
    const { user, dbUser, signOut } = useAuthStore();
    const {
        connected,
        notifications,
        onlineUsers,
        clearNotification,
        clearAllNotifications,
    } = useGlobalSocket();
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
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            )}

            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <span className="logo-icon">в–¶</span>
                        <span className="logo-text">Р‘С–СЂР¶Р° РљР°РЅР°Р»С–РІ</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `nav-item ${isActive ? 'active' : ''}`
                            }
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <img
                            src={user?.photoURL || `https://ui-avatars.com/api/?name=${dbUser?.displayName || 'U'}&background=4f46e5&color=fff`}
                            alt="Avatar"
                            className="user-avatar"
                        />
                        <div className="user-details">
                            <span className="user-name">{dbUser?.displayName || user?.email || 'РљРѕСЂРёСЃС‚СѓРІР°С‡'}</span>
                            <span className="user-email">{user?.email}</span>
                        </div>
                    </div>
                    <button className="btn-logout" onClick={handleSignOut} title="Р’РёР№С‚Рё">
                        рџљЄ
                    </button>
                </div>
            </aside>

            <div className="main-area">
                <header className="topbar">
                    <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        в°
                    </button>
                    <div className="topbar-right">
                        <button
                            className={`notifications-btn ${notifications.length > 0 ? 'has-items' : ''}`}
                            onClick={() => setNotificationsOpen((open) => !open)}
                            title="Notifications"
                        >
                            <span>рџ””</span>
                            {notifications.length > 0 && (
                                <span className="notifications-count">{notifications.length}</span>
                            )}
                        </button>

                        {notificationsOpen && (
                            <div className="notifications-panel">
                                <div className="notifications-panel-header">
                                    <strong>Notifications</strong>
                                    {notifications.length > 0 && (
                                        <button className="notifications-clear-all" onClick={clearAllNotifications}>
                                            Clear all
                                        </button>
                                    )}
                                </div>

                                <div className="notifications-panel-meta">
                                    <span>Socket: {connected ? 'online' : 'offline'}</span>
                                    <span>Users online: {onlineUsers.length}</span>
                                </div>

                                {notifications.length === 0 ? (
                                    <div className="notifications-empty">No notifications yet</div>
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
                                                <span className="notification-title">{notification.title || 'Notification'}</span>
                                                {notification.message && (
                                                    <span className="notification-message">{notification.message}</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <span className="topbar-greeting">
                            РџСЂРёРІС–С‚, <strong>{dbUser?.displayName || 'РљРѕСЂРёСЃС‚СѓРІР°С‡'}</strong> рџ‘‹
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


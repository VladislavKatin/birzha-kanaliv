import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import './DashboardLayout.css';

const navItems = [
    { path: '/dashboard', label: 'Дашборд', icon: '🏠' },
    { path: '/my-channels', label: 'Мої канали', icon: '📺' },
    { path: '/offers', label: 'Пропозиції', icon: '🔍' },
    { path: '/swaps/incoming', label: 'Вхідні', icon: '📥' },
    { path: '/swaps/outgoing', label: 'Вихідні', icon: '📤' },
    { path: '/exchanges', label: 'Обміни', icon: '🤝' },
    { path: '/profile/edit', label: 'Профіль', icon: '👤' },
    { path: '/settings/notifications', label: 'Сповіщення', icon: '🔔' },
];

export default function DashboardLayout() {
    const { user, dbUser, signOut } = useAuthStore();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/auth');
    };

    return (
        <div className="dashboard-layout">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <span className="logo-icon">▶</span>
                        <span className="logo-text">Біржа Каналів</span>
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
                            <span className="user-name">{dbUser?.displayName || user?.email || 'Користувач'}</span>
                            <span className="user-email">{user?.email}</span>
                        </div>
                    </div>
                    <button className="btn-logout" onClick={handleSignOut} title="Вийти">
                        🚪
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="main-area">
                <header className="topbar">
                    <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        ☰
                    </button>
                    <div className="topbar-right">
                        <span className="topbar-greeting">
                            Привіт, <strong>{dbUser?.displayName || 'Користувач'}</strong> 👋
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

import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquareText, RadioTower, ListChecks, RefreshCw, LogOut, History } from 'lucide-react';
import { useAuth } from '../stores/AuthProvider';

const navItems = [
    { to: '/dashboard', label: 'Аналітика', icon: LayoutDashboard },
    { to: '/users', label: 'Користувачі', icon: Users },
    { to: '/channels', label: 'Канали', icon: RadioTower },
    { to: '/offers', label: 'Офери', icon: ListChecks },
    { to: '/matches', label: 'Обміни', icon: RefreshCw },
    { to: '/history', label: 'Історія', icon: History },
    { to: '/support', label: 'Чат підтримки', icon: MessageSquareText },
];

export default function AdminLayout() {
    const navigate = useNavigate();
    const { dbUser, signOut } = useAuth();

    async function handleSignOut() {
        await signOut();
        navigate('/auth');
    }

    return (
        <div className="admin-shell">
            <aside className="admin-sidebar">
                <div className="admin-brand">
                    <span className="admin-brand-badge">YT</span>
                    <div>
                        <strong>Admin Console</strong>
                        <small>Біржа Каналів</small>
                    </div>
                </div>

                <nav className="admin-nav">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
                            >
                                <Icon size={18} />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                <button className="admin-logout" onClick={handleSignOut}>
                    <LogOut size={16} />
                    <span>Вийти</span>
                </button>
            </aside>

            <div className="admin-main">
                <header className="admin-topbar">
                    <div>
                        <h1>Панель адміністратора</h1>
                        <p>Керуйте користувачами, обмінами, модерацією та підтримкою.</p>
                    </div>
                    <div className="admin-topbar-user">
                        <strong>{dbUser?.displayName || 'Адміністратор'}</strong>
                        <small>{dbUser?.email || ''}</small>
                    </div>
                </header>

                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquareText, RadioTower, ListChecks, RefreshCw, LogOut, History, Activity, ShieldAlert, FlaskConical } from 'lucide-react';
import { useAuth } from '../stores/AuthProvider';
import api from '../services/api';

const navItems = [
    { to: '/dashboard', label: 'Аналітика', icon: LayoutDashboard },
    { to: '/users', label: 'Користувачі', icon: Users, badgeKey: 'newUsers' },
    { to: '/channels', label: 'Канали', icon: RadioTower },
    { to: '/offers', label: 'Офери', icon: ListChecks },
    { to: '/matches', label: 'Обміни', icon: RefreshCw },
    { to: '/history', label: 'Історія', icon: History },
    { to: '/system', label: 'Система', icon: Activity },
    { to: '/incidents', label: 'Інциденти', icon: ShieldAlert },
    { to: '/demo-content', label: 'Демо контент', icon: FlaskConical },
    { to: '/support', label: 'Чат підтримки', icon: MessageSquareText },
];

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { dbUser, signOut } = useAuth();
    const [menuBadges, setMenuBadges] = useState({ newUsers: 0 });

    useEffect(() => {
        let cancelled = false;

        async function loadBadges() {
            try {
                const response = await api.get('/admin/menu-badges');
                if (!cancelled) {
                    setMenuBadges({
                        newUsers: Number(response.data?.newUsers || 0),
                    });
                }
            } catch {
                if (!cancelled) {
                    setMenuBadges({ newUsers: 0 });
                }
            }
        }

        loadBadges();
        const intervalId = window.setInterval(loadBadges, 15000);

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, []);

    useEffect(() => {
        if (location.pathname !== '/users') return;

        let cancelled = false;

        async function markUsersSeen() {
            try {
                await api.post('/admin/menu-badges/seen', { scope: 'users' });
            } catch {
                // ignore; polling will refresh counters anyway
            } finally {
                if (!cancelled) {
                    setMenuBadges((prev) => ({ ...prev, newUsers: 0 }));
                }
            }
        }

        markUsersSeen();

        return () => {
            cancelled = true;
        };
    }, [location.pathname]);

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
                        const badgeValue = item.badgeKey ? Number(menuBadges[item.badgeKey] || 0) : 0;

                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
                            >
                                <Icon size={18} />
                                <span className="admin-nav-label">{item.label}</span>
                                {badgeValue > 0 && (
                                    <span className="admin-nav-badge">{badgeValue > 99 ? '99+' : badgeValue}</span>
                                )}
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

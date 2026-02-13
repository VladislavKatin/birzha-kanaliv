import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { formatAdminDate, normalizeAdminOverview, normalizeAdminUsers } from '../../services/adminCenter';
import './AdminControlCenterPage.css';

function DistributionList({ title, items }) {
    return (
        <section className="card admin-card">
            <h3>{title}</h3>
            {items.length === 0 ? (
                <p className="admin-empty">Немає даних</p>
            ) : (
                <ul className="admin-dist-list">
                    {items.map((item) => (
                        <li key={`${title}-${item.status || item.niche}`}>
                            <span>{item.status || item.niche || 'unknown'}</span>
                            <strong>{item.count}</strong>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

export default function AdminControlCenterPage() {
    const [data, setData] = useState(() => normalizeAdminOverview());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [usersData, setUsersData] = useState(() => normalizeAdminUsers());
    const [usersLoading, setUsersLoading] = useState(true);
    const [usersError, setUsersError] = useState('');
    const [userFilter, setUserFilter] = useState({ search: '', role: '' });
    const [userPage, setUserPage] = useState(1);
    const [updatingUserId, setUpdatingUserId] = useState('');

    useEffect(() => {
        loadOverview();
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function loadUsers() {
            setUsersLoading(true);
            setUsersError('');

            try {
                const params = new URLSearchParams();
                params.set('page', String(userPage));
                params.set('limit', '20');
                if (userFilter.search.trim()) {
                    params.set('search', userFilter.search.trim());
                }
                if (userFilter.role) {
                    params.set('role', userFilter.role);
                }

                const response = await api.get(`/admin/users?${params.toString()}`);
                if (cancelled) {
                    return;
                }
                setUsersData(normalizeAdminUsers(response.data));
            } catch (err) {
                if (!cancelled) {
                    setUsersError(err.response?.data?.error || 'Не вдалося завантажити список користувачів.');
                }
            } finally {
                if (!cancelled) {
                    setUsersLoading(false);
                }
            }
        }

        loadUsers();

        return () => {
            cancelled = true;
        };
    }, [userPage, userFilter]);

    async function loadOverview() {
        setLoading(true);
        setError('');

        try {
            const response = await api.get('/admin/overview');
            setData(normalizeAdminOverview(response.data));
        } catch (err) {
            setError(err.response?.data?.error || 'Не вдалося завантажити дані адмінки.');
        } finally {
            setLoading(false);
        }
    }

    async function handleRoleChange(user, nextRole) {
        if (!nextRole || user.role === nextRole) {
            return;
        }

        const reason = window.prompt('Причина зміни ролі (необов\'язково):', '') || '';

        setUpdatingUserId(user.id);
        try {
            const response = await api.patch(`/admin/users/${user.id}/role`, { role: nextRole, reason });
            const updatedRole = response.data.user?.role || nextRole;
            setUsersData((prev) => ({
                ...prev,
                users: prev.users.map((item) => (item.id === user.id ? { ...item, role: updatedRole } : item)),
            }));
            toast.success('Роль користувача оновлено.');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Не вдалося оновити роль.');
        } finally {
            setUpdatingUserId('');
        }
    }

    async function handleSuspendToggle(user) {
        const suspended = user.role !== 'suspended';
        const reason = window.prompt(
            suspended
                ? 'Причина призупинення доступу:'
                : 'Причина відновлення доступу (необов\'язково):',
            '',
        );

        if (suspended && !String(reason || '').trim()) {
            toast.error('Потрібно вказати причину призупинення.');
            return;
        }

        setUpdatingUserId(user.id);
        try {
            const response = await api.patch(`/admin/users/${user.id}/suspend`, {
                suspended,
                reason: String(reason || '').trim(),
            });
            const updatedRole = response.data.user?.role || (suspended ? 'suspended' : 'user');
            setUsersData((prev) => ({
                ...prev,
                users: prev.users.map((item) => (item.id === user.id ? { ...item, role: updatedRole } : item)),
            }));
            toast.success(suspended ? 'Доступ користувача призупинено.' : 'Доступ користувача відновлено.');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Не вдалося оновити статус користувача.');
        } finally {
            setUpdatingUserId('');
        }
    }

    const summaryCards = useMemo(
        () => [
            { label: 'Користувачі', value: data.summary.totalUsers },
            { label: 'Канали', value: data.summary.totalChannels },
            { label: 'Пропозиції', value: data.summary.totalOffers },
            { label: 'Матчі', value: data.summary.totalMatches },
            { label: 'Повідомлення', value: data.summary.totalMessages },
            { label: 'Відгуки', value: data.summary.totalReviews },
            { label: 'Нові користувачі (7д)', value: data.summary.newUsers7d },
            { label: 'Завершено обмінів (7д)', value: data.summary.matchesCompleted7d },
        ],
        [data.summary],
    );

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-pulse" />
                <p>Завантаження адмін-аналітики...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card admin-error-card">
                <h2>Admin Control Center</h2>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <header className="admin-header">
                <h1>Admin Control Center</h1>
                <p>Огляд системи: користувачі, обміни, чати, активність. Оновлено: {formatAdminDate(data.generatedAt)}</p>
            </header>

            <section className="admin-summary-grid">
                {summaryCards.map((card) => (
                    <article key={card.label} className="card admin-summary-card">
                        <span>{card.label}</span>
                        <strong>{card.value}</strong>
                    </article>
                ))}
            </section>

            <section className="admin-distributions-grid">
                <DistributionList title="Пропозиції за статусом" items={data.distributions.offersByStatus} />
                <DistributionList title="Матчі за статусом" items={data.distributions.matchesByStatus} />
                <DistributionList title="Популярні ніші" items={data.distributions.topNiches} />
            </section>

            <article className="card admin-users-card">
                <div className="admin-users-header">
                    <h3>Управління користувачами</h3>
                    <button className="btn btn-secondary btn-sm" onClick={loadOverview}>
                        Оновити метрики
                    </button>
                </div>

                <div className="admin-users-filters">
                    <input
                        type="text"
                        placeholder="Пошук: email, ім'я, firebaseUid"
                        value={userFilter.search}
                        onChange={(event) => {
                            setUserPage(1);
                            setUserFilter((prev) => ({ ...prev, search: event.target.value }));
                        }}
                    />
                    <select
                        value={userFilter.role}
                        onChange={(event) => {
                            setUserPage(1);
                            setUserFilter((prev) => ({ ...prev, role: event.target.value }));
                        }}
                    >
                        <option value="">Усі ролі</option>
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                        <option value="suspended">suspended</option>
                    </select>
                </div>

                {usersLoading ? (
                    <p className="admin-empty">Завантаження користувачів...</p>
                ) : usersError ? (
                    <p className="admin-empty">{usersError}</p>
                ) : (
                    <>
                        <div className="admin-table-wrap">
                            <table className="admin-users-table">
                                <thead>
                                    <tr>
                                        <th>Користувач</th>
                                        <th>Роль</th>
                                        <th>Каналів</th>
                                        <th>Створений</th>
                                        <th>Дії</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usersData.users.map((user) => (
                                        <tr key={user.id}>
                                            <td>
                                                <div className="admin-user-cell">
                                                    <strong>{user.displayName || user.email}</strong>
                                                    <span>{user.email}</span>
                                                    <span>{user.id}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`admin-role-badge role-${user.role}`}>{user.role}</span>
                                            </td>
                                            <td>{user.channelCount}</td>
                                            <td>{formatAdminDate(user.createdAt)}</td>
                                            <td>
                                                <div className="admin-user-actions">
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => handleRoleChange(user, user.role === 'admin' ? 'user' : 'admin')}
                                                        disabled={updatingUserId === user.id || user.role === 'suspended'}
                                                    >
                                                        {user.role === 'admin' ? 'Зробити user' : 'Зробити admin'}
                                                    </button>
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleSuspendToggle(user)}
                                                        disabled={updatingUserId === user.id}
                                                    >
                                                        {user.role === 'suspended' ? 'Відновити' : 'Призупинити'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="admin-users-pagination">
                            <span>
                                Сторінка {usersData.page} з {usersData.pages} · Всього {usersData.total}
                            </span>
                            <div className="admin-users-pagination-actions">
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setUserPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={usersData.page <= 1}
                                >
                                    Назад
                                </button>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setUserPage((prev) => Math.min(prev + 1, usersData.pages))}
                                    disabled={usersData.page >= usersData.pages}
                                >
                                    Далі
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </article>

            <section className="admin-data-grid">
                <article className="card admin-table-card">
                    <h3>Останні користувачі</h3>
                    <div className="admin-table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Користувач</th>
                                    <th>Роль</th>
                                    <th>Дата</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recent.users.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className="admin-user-cell">
                                                <strong>{user.displayName || user.email}</strong>
                                                <span>{user.email}</span>
                                            </div>
                                        </td>
                                        <td>{user.role}</td>
                                        <td>{formatAdminDate(user.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </article>

                <article className="card admin-table-card">
                    <h3>Останні обміни</h3>
                    <div className="admin-table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Ініціатор</th>
                                    <th>Ціль</th>
                                    <th>Статус</th>
                                    <th>Оновлено</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recent.matches.map((match) => (
                                    <tr key={match.id}>
                                        <td>{match.initiatorChannel?.channelTitle || '-'}</td>
                                        <td>{match.targetChannel?.channelTitle || '-'}</td>
                                        <td>{match.status}</td>
                                        <td>{formatAdminDate(match.updatedAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </article>

                <article className="card admin-table-card admin-table-card-full">
                    <h3>Останні повідомлення</h3>
                    <div className="admin-table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Відправник</th>
                                    <th>Матч</th>
                                    <th>Повідомлення</th>
                                    <th>Час</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recent.messages.map((message) => (
                                    <tr key={message.id}>
                                        <td>{message.sender?.displayName || message.sender?.email || '-'}</td>
                                        <td>{message.chatRoom?.matchId || '-'}</td>
                                        <td>{message.content}</td>
                                        <td>{formatAdminDate(message.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </article>
            </section>
        </div>
    );
}

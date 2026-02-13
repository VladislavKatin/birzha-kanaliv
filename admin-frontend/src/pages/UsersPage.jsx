import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { formatAdminDate, normalizeAdminUsers } from '../services/adminCenter';

function DetailSection({ title, children }) {
    return (
        <section className="card detail-card">
            <h3>{title}</h3>
            {children}
        </section>
    );
}

export default function UsersPage() {
    const [data, setData] = useState(() => normalizeAdminUsers());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState({ search: '', role: '' });
    const [page, setPage] = useState(1);
    const [updatingId, setUpdatingId] = useState('');

    const [detailsOpen, setDetailsOpen] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [details, setDetails] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError('');
            try {
                const params = new URLSearchParams();
                params.set('page', String(page));
                params.set('limit', '20');
                if (filter.search.trim()) params.set('search', filter.search.trim());
                if (filter.role) params.set('role', filter.role);
                const response = await api.get(`/admin/users?${params.toString()}`);
                if (!cancelled) setData(normalizeAdminUsers(response.data));
            } catch (err) {
                if (!cancelled) setError(err.response?.data?.error || 'Не вдалося завантажити користувачів');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [page, filter]);

    async function loadDetails(userId) {
        setDetailsOpen(true);
        setDetailsLoading(true);
        try {
            const response = await api.get(`/admin/users/${userId}/details`);
            setDetails(response.data || null);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Не вдалося завантажити деталі користувача');
        } finally {
            setDetailsLoading(false);
        }
    }

    async function handleRoleToggle(user) {
        const nextRole = user.role === 'admin' ? 'user' : 'admin';
        const reason = window.prompt('Причина зміни ролі (необов\'язково):', '') || '';

        setUpdatingId(user.id);
        try {
            const response = await api.patch(`/admin/users/${user.id}/role`, { role: nextRole, reason });
            const updatedRole = response.data.user?.role || nextRole;
            setData((prev) => ({
                ...prev,
                users: prev.users.map((item) => (item.id === user.id ? { ...item, role: updatedRole } : item)),
            }));
            if (details?.user?.id === user.id) {
                setDetails((prev) => prev ? ({ ...prev, user: { ...prev.user, role: updatedRole } }) : prev);
            }
            toast.success('Роль оновлено');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Не вдалося оновити роль');
        } finally {
            setUpdatingId('');
        }
    }

    async function handleSuspendToggle(user) {
        const suspended = user.role !== 'suspended';
        const reason = window.prompt(
            suspended ? 'Причина призупинення доступу:' : 'Причина відновлення (необов\'язково):',
            '',
        ) || '';

        if (suspended && !reason.trim()) {
            toast.error('Вкажіть причину призупинення');
            return;
        }

        setUpdatingId(user.id);
        try {
            const response = await api.patch(`/admin/users/${user.id}/suspend`, {
                suspended,
                reason: reason.trim(),
            });
            const updatedRole = response.data.user?.role || (suspended ? 'suspended' : 'user');
            setData((prev) => ({
                ...prev,
                users: prev.users.map((item) => (item.id === user.id ? { ...item, role: updatedRole } : item)),
            }));
            if (details?.user?.id === user.id) {
                setDetails((prev) => prev ? ({ ...prev, user: { ...prev.user, role: updatedRole } }) : prev);
            }
            toast.success(suspended ? 'Доступ призупинено' : 'Доступ відновлено');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Не вдалося змінити статус');
        } finally {
            setUpdatingId('');
        }
    }

    return (
        <>
            <section className="card">
                <div className="card-head">
                    <h2>Користувачі</h2>
                </div>

                <div className="filters-row">
                    <input
                        type="text"
                        placeholder="Пошук: email, ім'я, firebaseUid"
                        value={filter.search}
                        onChange={(event) => {
                            setPage(1);
                            setFilter((prev) => ({ ...prev, search: event.target.value }));
                        }}
                    />
                    <select
                        value={filter.role}
                        onChange={(event) => {
                            setPage(1);
                            setFilter((prev) => ({ ...prev, role: event.target.value }));
                        }}
                    >
                        <option value="">Усі ролі</option>
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                        <option value="suspended">suspended</option>
                    </select>
                </div>

                {loading ? (
                    <p className="empty-text">Завантаження...</p>
                ) : error ? (
                    <p className="error-text">{error}</p>
                ) : (
                    <>
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Користувач</th>
                                        <th>Роль</th>
                                        <th>Каналів</th>
                                        <th>Створено</th>
                                        <th>Дії</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.users.map((user) => (
                                        <tr key={user.id}>
                                            <td>
                                                <div className="user-cell">
                                                    <strong>{user.displayName || user.email}</strong>
                                                    <span>{user.email}</span>
                                                </div>
                                            </td>
                                            <td><span className={`role-badge role-${user.role}`}>{user.role}</span></td>
                                            <td>{user.channelCount}</td>
                                            <td>{formatAdminDate(user.createdAt)}</td>
                                            <td>
                                                <div className="action-row">
                                                    <button className="btn btn-secondary" onClick={() => loadDetails(user.id)}>Деталі</button>
                                                    <button
                                                        className="btn btn-secondary"
                                                        onClick={() => handleRoleToggle(user)}
                                                        disabled={updatingId === user.id || user.role === 'suspended'}
                                                    >
                                                        {user.role === 'admin' ? 'Зробити user' : 'Зробити admin'}
                                                    </button>
                                                    <button
                                                        className="btn btn-danger"
                                                        onClick={() => handleSuspendToggle(user)}
                                                        disabled={updatingId === user.id}
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

                        <div className="pagination-row">
                            <span>Сторінка {data.page} з {data.pages} · Всього {data.total}</span>
                            <div className="action-row">
                                <button className="btn btn-secondary" disabled={data.page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Назад</button>
                                <button className="btn btn-secondary" disabled={data.page >= data.pages} onClick={() => setPage((p) => Math.min(data.pages, p + 1))}>Далі</button>
                            </div>
                        </div>
                    </>
                )}
            </section>

            {detailsOpen ? (
                <div className="drawer-overlay" onClick={() => setDetailsOpen(false)}>
                    <aside className="drawer-panel" onClick={(event) => event.stopPropagation()}>
                        <div className="card-head">
                            <h2>Деталі користувача</h2>
                            <button className="btn btn-secondary" onClick={() => setDetailsOpen(false)}>Закрити</button>
                        </div>

                        {detailsLoading ? <p className="empty-text">Завантаження...</p> : !details ? <p className="empty-text">Немає даних</p> : (
                            <div className="drawer-body">
                                <section className="card detail-card">
                                    <h3>{details.user?.displayName || details.user?.email}</h3>
                                    <p className="muted-text">{details.user?.email}</p>
                                    <div className="action-row">
                                        <span className={`role-badge role-${details.user?.role}`}>{details.user?.role}</span>
                                        <span className="role-badge role-user">створено: {formatAdminDate(details.user?.createdAt)}</span>
                                    </div>
                                    <div className="summary-grid compact-summary-grid">
                                        <article className="summary-item"><span>Канали</span><strong>{details.summary?.channels || 0}</strong></article>
                                        <article className="summary-item"><span>Офери</span><strong>{details.summary?.offers || 0}</strong></article>
                                        <article className="summary-item"><span>Обміни</span><strong>{details.summary?.matches || 0}</strong></article>
                                        <article className="summary-item"><span>Support msg</span><strong>{details.summary?.supportMessages || 0}</strong></article>
                                    </div>
                                </section>

                                <DetailSection title="Канали">
                                    <ul className="dist-list compact-top">
                                        {(details.channels || []).map((channel) => (
                                            <li key={channel.id}>
                                                <span>{channel.channelTitle} ({channel.subscribers || 0})</span>
                                                <strong>{channel.isActive ? 'active' : 'inactive'}</strong>
                                            </li>
                                        ))}
                                    </ul>
                                </DetailSection>

                                <DetailSection title="Останні обміни">
                                    <div className="table-wrap compact-table">
                                        <table>
                                            <thead>
                                                <tr><th>ID</th><th>Статус</th><th>Канали</th></tr>
                                            </thead>
                                            <tbody>
                                                {(details.matches || []).map((match) => (
                                                    <tr key={match.id}>
                                                        <td>{match.id.slice(0, 8)}</td>
                                                        <td>{match.status}</td>
                                                        <td>{match.initiatorChannel?.channelTitle || '-'} → {match.targetChannel?.channelTitle || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </DetailSection>

                                <DetailSection title="Останні дії">
                                    <ul className="dist-list compact-top">
                                        {(details.recentActions || []).map((row) => (
                                            <li key={row.id}>
                                                <span>{row.action}</span>
                                                <strong>{formatAdminDate(row.createdAt)}</strong>
                                            </li>
                                        ))}
                                    </ul>
                                </DetailSection>
                            </div>
                        )}
                    </aside>
                </div>
            ) : null}
        </>
    );
}

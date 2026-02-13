import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { formatAdminDate, normalizeAdminUsers } from '../services/adminCenter';

export default function UsersPage() {
    const [data, setData] = useState(() => normalizeAdminUsers());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState({ search: '', role: '' });
    const [page, setPage] = useState(1);
    const [updatingId, setUpdatingId] = useState('');

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
            toast.success(suspended ? 'Доступ призупинено' : 'Доступ відновлено');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Не вдалося змінити статус');
        } finally {
            setUpdatingId('');
        }
    }

    return (
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
    );
}

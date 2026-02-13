import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { formatAdminDate } from '../services/adminCenter';

export default function ChannelsPage() {
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [filter, setFilter] = useState({ search: '', flagged: '' });
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
                if (filter.flagged) params.set('flagged', filter.flagged);
                const response = await api.get(`/admin/channels?${params.toString()}`);
                if (!cancelled) {
                    setChannels(response.data.channels || []);
                    setPages(Number(response.data.pages || 1));
                }
            } catch (err) {
                if (!cancelled) setError(err.response?.data?.error || 'Не вдалося завантажити канали');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [page, filter]);

    async function toggleFlag(channel) {
        const nextFlag = !channel.isFlagged;
        const reason = window.prompt(nextFlag ? 'Причина модерації:' : 'Причина зняття модерації:', '') || '';
        if (nextFlag && !reason.trim()) {
            toast.error('Потрібно вказати причину модерації');
            return;
        }

        setUpdatingId(channel.id);
        try {
            const response = await api.patch(`/admin/channels/${channel.id}/flag`, {
                isFlagged: nextFlag,
                reason: reason.trim(),
            });
            const updated = response.data.channel;
            setChannels((prev) => prev.map((item) => (item.id === channel.id ? { ...item, ...updated } : item)));
            toast.success(nextFlag ? 'Канал позначено' : 'Позначку знято');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Не вдалося змінити модерацію');
        } finally {
            setUpdatingId('');
        }
    }

    async function toggleActive(channel) {
        const next = !channel.isActive;
        const reason = window.prompt(next ? 'Причина активації (необов\'язково):' : 'Причина деактивації:', '') || '';
        if (!next && !reason.trim()) {
            toast.error('Вкажіть причину деактивації');
            return;
        }

        setUpdatingId(channel.id);
        try {
            const response = await api.patch(`/admin/channels/${channel.id}/active`, {
                isActive: next,
                reason: reason.trim(),
            });
            const updated = response.data.channel;
            setChannels((prev) => prev.map((item) => (item.id === channel.id ? { ...item, ...updated } : item)));
            toast.success(next ? 'Канал активовано' : 'Канал деактивовано');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Не вдалося змінити активність');
        } finally {
            setUpdatingId('');
        }
    }

    return (
        <section className="card">
            <div className="card-head">
                <h2>Канали</h2>
            </div>

            <div className="filters-row">
                <input
                    type="text"
                    placeholder="Пошук: назва або channelId"
                    value={filter.search}
                    onChange={(event) => {
                        setPage(1);
                        setFilter((prev) => ({ ...prev, search: event.target.value }));
                    }}
                />
                <select
                    value={filter.flagged}
                    onChange={(event) => {
                        setPage(1);
                        setFilter((prev) => ({ ...prev, flagged: event.target.value }));
                    }}
                >
                    <option value="">Усі</option>
                    <option value="true">Тільки flagged</option>
                    <option value="false">Тільки не flagged</option>
                </select>
            </div>

            {loading ? <p className="empty-text">Завантаження...</p> : error ? <p className="error-text">{error}</p> : (
                <>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Канал</th>
                                    <th>Власник</th>
                                    <th>Підписники</th>
                                    <th>Статус</th>
                                    <th>Оновлено</th>
                                    <th>Дії</th>
                                </tr>
                            </thead>
                            <tbody>
                                {channels.map((channel) => (
                                    <tr key={channel.id}>
                                        <td>
                                            <div className="user-cell">
                                                <strong>{channel.channelTitle}</strong>
                                                <span>{channel.channelId}</span>
                                                <span>{channel.niche || '-'} / {channel.language || '-'}</span>
                                            </div>
                                        </td>
                                        <td>{channel.owner?.displayName || channel.owner?.email || '-'}</td>
                                        <td>{channel.subscribers || 0}</td>
                                        <td>
                                            <div className="action-row">
                                                <span className={`role-badge ${channel.isFlagged ? 'role-suspended' : 'role-user'}`}>
                                                    {channel.isFlagged ? 'flagged' : 'clean'}
                                                </span>
                                                <span className={`role-badge ${channel.isActive ? 'role-admin' : 'role-suspended'}`}>
                                                    {channel.isActive ? 'active' : 'inactive'}
                                                </span>
                                            </div>
                                        </td>
                                        <td>{formatAdminDate(channel.updatedAt)}</td>
                                        <td>
                                            <div className="action-row">
                                                <button className="btn btn-secondary" disabled={updatingId === channel.id} onClick={() => toggleFlag(channel)}>
                                                    {channel.isFlagged ? 'Unflag' : 'Flag'}
                                                </button>
                                                <button className="btn btn-danger" disabled={updatingId === channel.id} onClick={() => toggleActive(channel)}>
                                                    {channel.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination-row">
                        <span>Сторінка {page} з {pages}</span>
                        <div className="action-row">
                            <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Назад</button>
                            <button className="btn btn-secondary" disabled={page >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>Далі</button>
                        </div>
                    </div>
                </>
            )}
        </section>
    );
}

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { formatAdminDate } from '../services/adminCenter';

const OFFER_STATUSES = ['open', 'matched', 'completed'];

export default function DemoContentPage() {
    const [data, setData] = useState({ summary: {}, channels: [], offers: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingId, setUpdatingId] = useState('');

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/admin/demo/channels');
            setData(response.data || {});
        } catch (err) {
            setError(err.response?.data?.error || 'Не вдалося завантажити демо-контент');
        } finally {
            setLoading(false);
        }
    }

    async function toggleChannel(channel) {
        const reason = window.prompt(channel.isActive ? 'Причина вимкнення демо-каналу:' : 'Причина ввімкнення демо-каналу:', '') || '';
        if (!reason.trim()) {
            toast.error('Вкажіть причину');
            return;
        }

        setUpdatingId(channel.id);
        try {
            const response = await api.patch(`/admin/demo/channels/${channel.id}/active`, {
                isActive: !channel.isActive,
                reason: reason.trim(),
            });
            const updated = response.data.channel;
            setData((prev) => ({
                ...prev,
                channels: (prev.channels || []).map((item) => (item.id === channel.id ? { ...item, ...updated } : item)),
            }));
            toast.success('Статус каналу оновлено');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Не вдалося змінити статус каналу');
        } finally {
            setUpdatingId('');
        }
    }

    async function setOfferStatus(offer, status) {
        const reason = window.prompt('Причина зміни статусу:', '') || '';
        if (!reason.trim()) {
            toast.error('Вкажіть причину');
            return;
        }

        setUpdatingId(offer.id);
        try {
            const response = await api.patch(`/admin/demo/offers/${offer.id}/status`, {
                status,
                reason: reason.trim(),
            });
            const updated = response.data.offer;
            setData((prev) => ({
                ...prev,
                offers: (prev.offers || []).map((item) => (item.id === offer.id ? { ...item, ...updated } : item)),
            }));
            toast.success('Статус офера оновлено');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Не вдалося змінити статус офера');
        } finally {
            setUpdatingId('');
        }
    }

    return (
        <div className="admin-page-grid">
            <section className="card">
                <div className="card-head">
                    <h2>Керування DEMO-контентом</h2>
                    <button className="btn btn-secondary" onClick={load}>Оновити</button>
                </div>

                <div className="summary-grid compact-summary-grid">
                    <article className="summary-item"><span>DEMO каналів</span><strong>{data.summary?.channels || 0}</strong></article>
                    <article className="summary-item"><span>Активних DEMO</span><strong>{data.summary?.activeChannels || 0}</strong></article>
                    <article className="summary-item"><span>DEMO оферів</span><strong>{data.summary?.offers || 0}</strong></article>
                </div>
            </section>

            <section className="card">
                <h3>DEMO канали</h3>
                {loading ? <p className="empty-text">Завантаження...</p> : error ? <p className="error-text">{error}</p> : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Канал</th>
                                    <th>Власник</th>
                                    <th>Статус</th>
                                    <th>Оновлено</th>
                                    <th>Дії</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data.channels || []).map((channel) => (
                                    <tr key={channel.id}>
                                        <td>{channel.channelTitle}</td>
                                        <td>{channel.owner?.email || '-'}</td>
                                        <td><span className={`role-badge ${channel.isActive ? 'role-admin' : 'role-suspended'}`}>{channel.isActive ? 'active' : 'inactive'}</span></td>
                                        <td>{formatAdminDate(channel.updatedAt)}</td>
                                        <td>
                                            <button className="btn btn-secondary" disabled={updatingId === channel.id} onClick={() => toggleChannel(channel)}>
                                                {channel.isActive ? 'Вимкнути' : 'Увімкнути'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="card">
                <h3>DEMO офери</h3>
                {loading ? <p className="empty-text">Завантаження...</p> : error ? <p className="error-text">{error}</p> : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Канал</th>
                                    <th>Опис</th>
                                    <th>Статус</th>
                                    <th>Дії</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data.offers || []).map((offer) => (
                                    <tr key={offer.id}>
                                        <td>{offer.channel?.channelTitle || '-'}</td>
                                        <td>{offer.description || '-'}</td>
                                        <td><span className="role-badge role-user">{offer.status}</span></td>
                                        <td>
                                            <div className="action-row">
                                                {OFFER_STATUSES.map((status) => (
                                                    <button
                                                        key={status}
                                                        className="btn btn-secondary"
                                                        disabled={updatingId === offer.id || offer.status === status}
                                                        onClick={() => setOfferStatus(offer, status)}
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

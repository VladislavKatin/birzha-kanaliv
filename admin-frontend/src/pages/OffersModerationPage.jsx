import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { formatAdminDate } from '../services/adminCenter';

const OFFER_STATUSES = ['open', 'matched', 'completed'];

export default function OffersModerationPage() {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [filter, setFilter] = useState({ status: '', search: '' });
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
                if (filter.status) params.set('status', filter.status);
                if (filter.search.trim()) params.set('search', filter.search.trim());
                const response = await api.get(`/admin/offers?${params.toString()}`);
                if (!cancelled) {
                    setOffers(response.data.offers || []);
                    setPages(Number(response.data.pages || 1));
                }
            } catch (err) {
                if (!cancelled) setError(err.response?.data?.error || 'Не вдалося завантажити офери');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [page, filter]);

    async function setStatus(offer, status) {
        if (offer.status === status) return;
        const reason = window.prompt('Причина зміни статусу (необов\'язково):', '') || '';

        setUpdatingId(offer.id);
        try {
            const response = await api.patch(`/admin/offers/${offer.id}/status`, { status, reason });
            setOffers((prev) => prev.map((item) => (item.id === offer.id ? { ...item, ...response.data.offer } : item)));
            toast.success('Статус офера оновлено');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Не вдалося оновити статус');
        } finally {
            setUpdatingId('');
        }
    }

    return (
        <section className="card">
            <div className="card-head">
                <h2>Офери</h2>
            </div>

            <div className="filters-row">
                <input
                    type="text"
                    placeholder="Пошук в описі"
                    value={filter.search}
                    onChange={(event) => {
                        setPage(1);
                        setFilter((prev) => ({ ...prev, search: event.target.value }));
                    }}
                />
                <select
                    value={filter.status}
                    onChange={(event) => {
                        setPage(1);
                        setFilter((prev) => ({ ...prev, status: event.target.value }));
                    }}
                >
                    <option value="">Усі статуси</option>
                    {OFFER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
            </div>

            {loading ? <p className="empty-text">Завантаження...</p> : error ? <p className="error-text">{error}</p> : (
                <>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Офер</th>
                                    <th>Канал</th>
                                    <th>Статус</th>
                                    <th>Тип</th>
                                    <th>Дата</th>
                                    <th>Дії</th>
                                </tr>
                            </thead>
                            <tbody>
                                {offers.map((offer) => (
                                    <tr key={offer.id}>
                                        <td>{offer.description || '-'}</td>
                                        <td>
                                            <div className="user-cell">
                                                <strong>{offer.channel?.channelTitle || '-'}</strong>
                                                <span>{offer.channel?.owner?.displayName || offer.channel?.owner?.email || '-'}</span>
                                            </div>
                                        </td>
                                        <td><span className="role-badge role-user">{offer.status}</span></td>
                                        <td>{offer.type}</td>
                                        <td>{formatAdminDate(offer.createdAt)}</td>
                                        <td>
                                            <div className="action-row">
                                                {OFFER_STATUSES.map((status) => (
                                                    <button
                                                        key={status}
                                                        className="btn btn-secondary"
                                                        disabled={updatingId === offer.id || offer.status === status}
                                                        onClick={() => setStatus(offer, status)}
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

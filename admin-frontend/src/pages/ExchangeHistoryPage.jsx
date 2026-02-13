import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { formatAdminDate } from '../services/adminCenter';

const MATCH_STATUSES = ['', 'pending', 'accepted', 'completed', 'rejected'];

function SummaryCard({ label, value }) {
    return (
        <article className="summary-item">
            <span>{label}</span>
            <strong>{value}</strong>
        </article>
    );
}

export default function ExchangeHistoryPage() {
    const [data, setData] = useState({
        page: 1,
        pages: 1,
        total: 0,
        matches: [],
        summary: { completedCount: 0, reviewsCount: 0, avgRating: 0, statuses: [] },
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({ status: '', search: '' });
    const [page, setPage] = useState(1);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError('');

            try {
                const params = new URLSearchParams();
                params.set('page', String(page));
                params.set('limit', '20');
                if (filters.status) params.set('status', filters.status);
                if (filters.search.trim()) params.set('search', filters.search.trim());

                const response = await api.get(`/admin/exchange-history?${params.toString()}`);
                if (!cancelled) {
                    setData(response.data || data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.response?.data?.error || 'Не вдалося завантажити історію обмінів');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [page, filters]);

    const statusMap = useMemo(() => {
        const map = new Map();
        (data.summary?.statuses || []).forEach((row) => {
            map.set(row.status, Number(row.count || 0));
        });
        return map;
    }, [data.summary]);

    return (
        <div className="admin-page-grid">
            <section className="card">
                <div className="card-head">
                    <h2>Історія обмінів</h2>
                </div>

                <div className="summary-grid">
                    <SummaryCard label="Всього обмінів" value={data.total || 0} />
                    <SummaryCard label="Завершено" value={data.summary?.completedCount || 0} />
                    <SummaryCard label="Відгуків" value={data.summary?.reviewsCount || 0} />
                    <SummaryCard label="Середній рейтинг" value={data.summary?.avgRating || 0} />
                </div>

                <ul className="dist-list compact-top">
                    <li><span>pending</span><strong>{statusMap.get('pending') || 0}</strong></li>
                    <li><span>accepted</span><strong>{statusMap.get('accepted') || 0}</strong></li>
                    <li><span>completed</span><strong>{statusMap.get('completed') || 0}</strong></li>
                    <li><span>rejected</span><strong>{statusMap.get('rejected') || 0}</strong></li>
                </ul>
            </section>

            <section className="card">
                <div className="filters-row">
                    <input
                        type="text"
                        placeholder="Пошук по назві каналу"
                        value={filters.search}
                        onChange={(event) => {
                            setPage(1);
                            setFilters((prev) => ({ ...prev, search: event.target.value }));
                        }}
                    />
                    <select
                        value={filters.status}
                        onChange={(event) => {
                            setPage(1);
                            setFilters((prev) => ({ ...prev, status: event.target.value }));
                        }}
                    >
                        {MATCH_STATUSES.map((status) => (
                            <option key={status || 'all'} value={status}>{status || 'Усі статуси'}</option>
                        ))}
                    </select>
                </div>

                {loading ? <p className="empty-text">Завантаження...</p> : error ? <p className="error-text">{error}</p> : (
                    <>
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Канали</th>
                                        <th>Офер</th>
                                        <th>Статус</th>
                                        <th>Відгуки</th>
                                        <th>Оновлено</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(data.matches || []).map((match) => (
                                        <tr key={match.id}>
                                            <td>
                                                <div className="user-cell">
                                                    <strong>{match.initiatorChannel?.channelTitle || '-'}</strong>
                                                    <span>{match.targetChannel?.channelTitle || '-'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="user-cell">
                                                    <strong>{match.offer?.type || '-'}</strong>
                                                    <span>{match.offer?.description || '-'}</span>
                                                </div>
                                            </td>
                                            <td><span className="role-badge role-user">{match.status}</span></td>
                                            <td>{match.reviewsCount || 0} / {match.avgRating || 0}</td>
                                            <td>{formatAdminDate(match.updatedAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="pagination-row">
                            <span>Сторінка {data.page || 1} з {data.pages || 1}</span>
                            <div className="action-row">
                                <button className="btn btn-secondary" disabled={(data.page || 1) <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Назад</button>
                                <button className="btn btn-secondary" disabled={(data.page || 1) >= (data.pages || 1)} onClick={() => setPage((p) => Math.min(data.pages || 1, p + 1))}>Далі</button>
                            </div>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}

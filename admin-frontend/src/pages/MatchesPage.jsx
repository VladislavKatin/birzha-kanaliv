import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { formatAdminDate } from '../services/adminCenter';

const MATCH_STATUSES = ['pending', 'accepted', 'completed', 'rejected'];

export default function MatchesPage() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [status, setStatus] = useState('');
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
                if (status) params.set('status', status);
                const response = await api.get(`/admin/matches?${params.toString()}`);
                if (!cancelled) {
                    setMatches(response.data.matches || []);
                    setPages(Number(response.data.pages || 1));
                }
            } catch (err) {
                if (!cancelled) setError(err.response?.data?.error || 'Не вдалося завантажити обміни');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [page, status]);

    async function setMatchStatus(match, nextStatus) {
        if (match.status === nextStatus) return;
        const reason = window.prompt('Причина зміни статусу (необов\'язково):', '') || '';

        setUpdatingId(match.id);
        try {
            const response = await api.patch(`/admin/matches/${match.id}/status`, { status: nextStatus, reason });
            setMatches((prev) => prev.map((item) => (item.id === match.id ? { ...item, ...response.data.match } : item)));
            toast.success('Статус обміну оновлено');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Не вдалося оновити статус');
        } finally {
            setUpdatingId('');
        }
    }

    return (
        <section className="card">
            <div className="card-head">
                <h2>Обміни</h2>
            </div>

            <div className="filters-row">
                <input type="text" disabled value="Фільтр за статусом" />
                <select
                    value={status}
                    onChange={(event) => {
                        setPage(1);
                        setStatus(event.target.value);
                    }}
                >
                    <option value="">Усі статуси</option>
                    {MATCH_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {loading ? <p className="empty-text">Завантаження...</p> : error ? <p className="error-text">{error}</p> : (
                <>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Ініціатор</th>
                                    <th>Ціль</th>
                                    <th>Офер</th>
                                    <th>Статус</th>
                                    <th>Оновлено</th>
                                    <th>Дії</th>
                                </tr>
                            </thead>
                            <tbody>
                                {matches.map((match) => (
                                    <tr key={match.id}>
                                        <td>{match.initiatorChannel?.channelTitle || '-'}</td>
                                        <td>{match.targetChannel?.channelTitle || '-'}</td>
                                        <td>{match.offer?.type || '-'} / {match.offer?.status || '-'}</td>
                                        <td><span className="role-badge role-user">{match.status}</span></td>
                                        <td>{formatAdminDate(match.updatedAt)}</td>
                                        <td>
                                            <div className="action-row">
                                                {MATCH_STATUSES.map((s) => (
                                                    <button key={s} className="btn btn-secondary" disabled={updatingId === match.id || match.status === s} onClick={() => setMatchStatus(match, s)}>
                                                        {s}
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

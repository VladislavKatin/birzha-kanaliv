import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatAdminDate, normalizeAdminOverview } from '../services/adminCenter';

function DistributionCard({ title, items, keyName = 'status' }) {
    return (
        <section className="card">
            <h3>{title}</h3>
            {items.length === 0 ? (
                <p className="empty-text">Немає даних</p>
            ) : (
                <ul className="dist-list">
                    {items.map((item) => (
                        <li key={`${title}-${item[keyName] || item.niche}`}>
                            <span>{item[keyName] || item.niche || 'unknown'}</span>
                            <strong>{item.count}</strong>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

export default function DashboardPage() {
    const navigate = useNavigate();
    const [data, setData] = useState(() => normalizeAdminOverview());
    const [supportThreads, setSupportThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        load();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    async function load() {
        setLoading(true);
        setError('');
        try {
            const [overviewResponse, supportResponse] = await Promise.all([
                api.get('/admin/overview'),
                api.get('/admin/support/threads'),
            ]);
            setData(normalizeAdminOverview(overviewResponse.data));
            setSupportThreads((supportResponse.data?.threads || []).slice(0, 6));
        } catch (err) {
            setError(err.response?.data?.error || 'Не вдалося завантажити аналітику');
        } finally {
            setLoading(false);
        }
    }

    const summary = useMemo(() => [
        ['Користувачі', data.summary.totalUsers],
        ['Канали', data.summary.totalChannels],
        ['Пропозиції', data.summary.totalOffers],
        ['Обміни', data.summary.totalMatches],
        ['Повідомлення', data.summary.totalMessages],
        ['Відгуки', data.summary.totalReviews],
        ['Нові користувачі (7д)', data.summary.newUsers7d],
        ['Завершено (7д)', data.summary.matchesCompleted7d],
    ], [data.summary]);

    if (loading) {
        return <div className="card">Завантаження аналітики...</div>;
    }

    if (error) {
        return <div className="card error-text">{error}</div>;
    }

    return (
        <div className="admin-page-grid">
            <section className="card">
                <div className="card-head">
                    <h2>Огляд платформи</h2>
                    <button className="btn btn-secondary" onClick={load}>Оновити</button>
                </div>
                <p className="muted-text">Оновлено: {formatAdminDate(data.generatedAt)}</p>
                <div className="summary-grid">
                    {summary.map(([label, value]) => (
                        <article className="summary-item" key={label}>
                            <span>{label}</span>
                            <strong>{value}</strong>
                        </article>
                    ))}
                </div>
            </section>

            <div className="distribution-grid">
                <DistributionCard title="Пропозиції за статусом" items={data.distributions.offersByStatus} />
                <DistributionCard title="Обміни за статусом" items={data.distributions.matchesByStatus} />
                <DistributionCard title="Популярні ніші" items={data.distributions.topNiches} keyName="niche" />
            </div>

            <section className="card">
                <h3>Останні користувачі</h3>
                <div className="table-wrap">
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
                                    <td>{user.displayName || user.email}</td>
                                    <td>{user.role}</td>
                                    <td>{formatAdminDate(user.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="card">
                <div className="card-head">
                    <h3>Нові звернення в чат підтримки</h3>
                    <button className="btn btn-secondary" onClick={() => navigate('/support')}>
                        Відкрити чат
                    </button>
                </div>
                {supportThreads.length === 0 ? (
                    <p className="empty-text">Нових звернень немає.</p>
                ) : (
                    <ul className="dist-list">
                        {supportThreads.map((thread) => (
                            <li key={thread.user.id}>
                                <span>{thread.user.displayName || thread.user.email}</span>
                                <strong>{formatAdminDate(thread.lastMessageAt)}</strong>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => navigate(`/support?userId=${thread.user.id}`)}
                                >
                                    Відповісти
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { formatAdminDate, normalizeAdminOverview } from '../../services/adminCenter';
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

    useEffect(() => {
        let cancelled = false;

        async function loadOverview() {
            setLoading(true);
            setError('');
            try {
                const response = await api.get('/admin/overview');
                if (cancelled) {
                    return;
                }
                setData(normalizeAdminOverview(response.data));
            } catch (err) {
                if (!cancelled) {
                    setError(err.response?.data?.error || 'Не вдалося завантажити дані адмінки.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadOverview();

        return () => {
            cancelled = true;
        };
    }, []);

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

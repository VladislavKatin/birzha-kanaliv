import { useEffect, useState } from 'react';
import api from '../services/api';
import { formatAdminDate } from '../services/adminCenter';

export default function IncidentsPage() {
    const [data, setData] = useState({ incidents: [], topIps: [], topActions: [], summaryByLevel: {}, total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState({ range: '24h', severity: '' });

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError('');
            try {
                const params = new URLSearchParams();
                params.set('range', filter.range);
                if (filter.severity) params.set('severity', filter.severity);
                const response = await api.get(`/admin/incidents?${params.toString()}`);
                if (!cancelled) setData(response.data || {});
            } catch (err) {
                if (!cancelled) setError(err.response?.data?.error || 'Не вдалося завантажити інциденти');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [filter]);

    return (
        <div className="admin-page-grid">
            <section className="card">
                <div className="card-head">
                    <h2>Центр інцидентів</h2>
                </div>

                <div className="filters-row">
                    <select value={filter.range} onChange={(event) => setFilter((prev) => ({ ...prev, range: event.target.value }))}>
                        <option value="24h">Останні 24 години</option>
                        <option value="7d">Останні 7 днів</option>
                    </select>
                    <select value={filter.severity} onChange={(event) => setFilter((prev) => ({ ...prev, severity: event.target.value }))}>
                        <option value="">Усі рівні</option>
                        <option value="high">high</option>
                        <option value="medium">medium</option>
                        <option value="low">low</option>
                    </select>
                </div>

                {loading ? <p className="empty-text">Завантаження...</p> : error ? <p className="error-text">{error}</p> : (
                    <>
                        <div className="summary-grid compact-summary-grid">
                            <article className="summary-item"><span>Всього</span><strong>{data.total || 0}</strong></article>
                            <article className="summary-item"><span>high</span><strong>{data.summaryByLevel?.high || 0}</strong></article>
                            <article className="summary-item"><span>medium</span><strong>{data.summaryByLevel?.medium || 0}</strong></article>
                            <article className="summary-item"><span>low</span><strong>{data.summaryByLevel?.low || 0}</strong></article>
                        </div>

                        <div className="table-wrap compact-top">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Час</th>
                                        <th>Рівень</th>
                                        <th>Ризик</th>
                                        <th>Action</th>
                                        <th>Користувач</th>
                                        <th>IP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(data.incidents || []).map((item) => (
                                        <tr key={item.id}>
                                            <td>{formatAdminDate(item.createdAt)}</td>
                                            <td><span className={`role-badge ${item.level === 'high' ? 'role-suspended' : item.level === 'medium' ? 'role-user' : 'role-admin'}`}>{item.level}</span></td>
                                            <td><span className={`role-badge ${item.riskTag === 'critical' ? 'role-suspended' : item.riskTag === 'elevated' ? 'role-user' : 'role-admin'}`}>{item.riskTag}</span></td>
                                            <td>{item.action}</td>
                                            <td>{item.user?.email || item.user?.displayName || '-'}</td>
                                            <td>{item.ip || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </section>

            <section className="card two-col-grid">
                <div>
                    <h3>Підозрілі IP (трафік за період)</h3>
                    <ul className="dist-list compact-top">
                        {(data.topIps || []).map((row) => (
                            <li key={`ip-${row.ip || 'empty'}`}>
                                <span>{row.ip || '-'}</span>
                                <strong>{row.count}</strong>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h3>Топ інцидентних actions</h3>
                    <ul className="dist-list compact-top">
                        {(data.topActions || []).map((row) => (
                            <li key={`act-${row.action}`}>
                                <span>{row.action}</span>
                                <strong>{row.count}</strong>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </div>
    );
}

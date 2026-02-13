import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { formatAdminDate } from '../services/adminCenter';

function Metric({ label, value }) {
    return (
        <article className="summary-item">
            <span>{label}</span>
            <strong>{value}</strong>
        </article>
    );
}

export default function SystemInsightsPage() {
    const [data, setData] = useState({
        generatedAt: null,
        summary: {},
        topActions: [],
        topIps: [],
        registrations7d: [],
        completedExchanges7d: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/admin/system/insights');
            setData(response.data || {});
        } catch (err) {
            setError(err.response?.data?.error || 'Не вдалося завантажити системні інсайти');
        } finally {
            setLoading(false);
        }
    }

    const metrics = useMemo(() => {
        const s = data.summary || {};
        return [
            ['Користувачів', s.usersTotal || 0],
            ['Suspended', s.suspendedUsers || 0],
            ['Каналів', s.channelsTotal || 0],
            ['Flagged канали', s.flaggedChannels || 0],
            ['Неактивні 30д', s.inactiveChannels30d || 0],
            ['Open офери', s.offersOpen || 0],
            ['Pending обміни', s.matchesPending || 0],
            ['Support msg / 24г', s.supportMessages24h || 0],
            ['Admin дій / 24г', s.adminActions24h || 0],
        ];
    }, [data.summary]);

    if (loading) return <section className="card">Завантаження системних даних...</section>;
    if (error) return <section className="card error-text">{error}</section>;

    return (
        <div className="admin-page-grid">
            <section className="card">
                <div className="card-head">
                    <h2>Системні інсайти</h2>
                    <button className="btn btn-secondary" onClick={load}>Оновити</button>
                </div>
                <p className="muted-text">Оновлено: {formatAdminDate(data.generatedAt)}</p>
                <div className="summary-grid">
                    {metrics.map(([label, value]) => <Metric key={label} label={label} value={value} />)}
                </div>
            </section>

            <section className="card two-col-grid">
                <div>
                    <h3>Топ actions за 24г</h3>
                    <div className="table-wrap compact-table">
                        <table>
                            <thead>
                                <tr><th>Action</th><th>К-сть</th></tr>
                            </thead>
                            <tbody>
                                {(data.topActions || []).map((row) => (
                                    <tr key={`a-${row.action}`}>
                                        <td>{row.action}</td>
                                        <td>{row.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div>
                    <h3>Топ IP за 24г</h3>
                    <div className="table-wrap compact-table">
                        <table>
                            <thead>
                                <tr><th>IP</th><th>К-сть</th></tr>
                            </thead>
                            <tbody>
                                {(data.topIps || []).map((row) => (
                                    <tr key={`ip-${row.ip || 'empty'}`}>
                                        <td>{row.ip || '-'}</td>
                                        <td>{row.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <section className="card two-col-grid">
                <div>
                    <h3>Реєстрації за 7 днів</h3>
                    <ul className="dist-list compact-top">
                        {(data.registrations7d || []).map((row) => (
                            <li key={`reg-${row.day}`}>
                                <span>{formatAdminDate(row.day)}</span>
                                <strong>{row.count}</strong>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h3>Завершені обміни за 7 днів</h3>
                    <ul className="dist-list compact-top">
                        {(data.completedExchanges7d || []).map((row) => (
                            <li key={`ex-${row.day}`}>
                                <span>{formatAdminDate(row.day)}</span>
                                <strong>{row.count}</strong>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </div>
    );
}

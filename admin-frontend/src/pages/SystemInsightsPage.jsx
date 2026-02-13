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
        currentLimits: {},
    });
    const [limits, setLimits] = useState({ offersPerWeek: 5, activeExchangesPerChannel: 3, reason: '' });
    const [exportHistory, setExportHistory] = useState({ items: [], total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [savingLimits, setSavingLimits] = useState(false);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setLoading(true);
        setError('');
        try {
            const [insightsRes, limitsRes, exportHistoryRes] = await Promise.all([
                api.get('/admin/system/insights'),
                api.get('/admin/system/limits'),
                api.get('/admin/exports/history'),
            ]);

            const nextInsights = insightsRes.data || {};
            const nextLimits = limitsRes.data?.limits || {};
            setData(nextInsights);
            setLimits({
                offersPerWeek: Number(nextLimits.offersPerWeek || nextInsights.currentLimits?.offersPerWeek || 5),
                activeExchangesPerChannel: Number(nextLimits.activeExchangesPerChannel || nextInsights.currentLimits?.activeExchangesPerChannel || 3),
                reason: '',
            });
            setExportHistory(exportHistoryRes.data || { items: [], total: 0 });
        } catch (err) {
            setError(err.response?.data?.error || 'Не вдалося завантажити системні інсайти');
        } finally {
            setLoading(false);
        }
    }

    async function exportCsv(path, filenamePrefix) {
        try {
            const response = await api.get(path, { responseType: 'blob' });
            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filenamePrefix}-${Date.now()}.csv`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            await load();
        } catch {
            setError('Не вдалося експортувати CSV');
        }
    }

    async function saveLimits() {
        setSavingLimits(true);
        setError('');
        try {
            await api.patch('/admin/system/limits', {
                offersPerWeek: Number(limits.offersPerWeek),
                activeExchangesPerChannel: Number(limits.activeExchangesPerChannel),
                reason: limits.reason,
            });
            await load();
        } catch (err) {
            setError(err.response?.data?.error || 'Не вдалося оновити ліміти');
        } finally {
            setSavingLimits(false);
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

    return (
        <div className="admin-page-grid">
            {error ? <section className="card error-text">{error}</section> : null}

            <section className="card">
                <div className="card-head">
                    <h2>Системні інсайти</h2>
                    <div className="action-row">
                        <button className="btn btn-secondary" onClick={() => exportCsv('/admin/exports/users.csv', 'users-report')}>Users CSV</button>
                        <button className="btn btn-secondary" onClick={() => exportCsv('/admin/exports/exchanges.csv', 'exchanges-report')}>Exchanges CSV</button>
                        <button className="btn btn-secondary" onClick={() => exportCsv('/admin/exports/support.csv', 'support-report')}>Support CSV</button>
                        <button className="btn btn-secondary" onClick={load}>Оновити</button>
                    </div>
                </div>
                <p className="muted-text">Оновлено: {formatAdminDate(data.generatedAt)}</p>
                <div className="summary-grid">
                    {metrics.map(([label, value]) => <Metric key={label} label={label} value={value} />)}
                </div>
            </section>

            <section className="card two-col-grid">
                <div>
                    <h3>Антиспам ліміти</h3>
                    <div className="settings-grid compact-top">
                        <label>
                            <span>Оферів на канал за 7 днів</span>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={limits.offersPerWeek}
                                onChange={(event) => setLimits((prev) => ({ ...prev, offersPerWeek: event.target.value }))}
                            />
                        </label>
                        <label>
                            <span>Активних обмінів на канал</span>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={limits.activeExchangesPerChannel}
                                onChange={(event) => setLimits((prev) => ({ ...prev, activeExchangesPerChannel: event.target.value }))}
                            />
                        </label>
                        <label>
                            <span>Причина зміни</span>
                            <input
                                type="text"
                                value={limits.reason}
                                onChange={(event) => setLimits((prev) => ({ ...prev, reason: event.target.value }))}
                                placeholder="Наприклад: корекція навантаження"
                            />
                        </label>
                    </div>
                    <div className="action-row compact-top">
                        <button className="btn btn-primary" disabled={savingLimits} onClick={saveLimits}>Зберегти ліміти</button>
                    </div>
                </div>

                <div>
                    <h3>Історія експортів</h3>
                    <p className="muted-text">Всього: {exportHistory.total || 0}</p>
                    <div className="table-wrap compact-table">
                        <table>
                            <thead>
                                <tr><th>Час</th><th>Файл</th><th>Рядків</th><th>Хто</th></tr>
                            </thead>
                            <tbody>
                                {(exportHistory.items || []).slice(0, 15).map((row) => (
                                    <tr key={row.id}>
                                        <td>{formatAdminDate(row.createdAt)}</td>
                                        <td>{row.action}</td>
                                        <td>{row.rowCount}</td>
                                        <td>{row.user?.email || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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

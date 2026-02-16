import { useState, useEffect } from 'react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';
import api from '../../services/api';
import './InfluenceChart.css';

function getApiErrorMessage(error, fallbackMessage) {
    return error?.response?.data?.error || fallbackMessage;
}

export default function InfluenceChart() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInfo, setShowInfo] = useState(false);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoadError('');
        try {
            const res = await api.get('/user/influence-history');
            setData(res.data.history || []);
        } catch (error) {
            console.error('Failed to load influence history:', error);
            setLoadError(getApiErrorMessage(error, 'Не вдалося завантажити історію Influence Score.'));
            setData([]);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="influence-chart-loading">Завантаження...</div>;
    if (loadError) return <div className="influence-chart-loading">{loadError}</div>;
    if (data.length === 0) return null;

    const currentScore = data[data.length - 1]?.score || 0;

    return (
        <div className="influence-chart card">
            <div className="chart-header">
                <div className="chart-title-wrap">
                    <h3>Influence Score</h3>
                    <button
                        type="button"
                        className="chart-info-btn"
                        onClick={() => setShowInfo((value) => !value)}
                        aria-label="Що таке Influence Score"
                    >
                        ?
                    </button>
                </div>
                <span className="chart-current-score">{currentScore}</span>
            </div>
            {showInfo && (
                <div className="chart-info-popover">
                    Influence Score - інтегральна оцінка каналу від 0 до 100.
                    Формується з активності в обмінах, завершених угод, відгуків,
                    стабільності та взаємодій у чатах.
                </div>
            )}
            <div className="chart-container">
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                        <defs>
                            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--brand-500)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--brand-500)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(d) => new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}
                            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                            axisLine={{ stroke: 'var(--border-color)' }}
                            interval={6}
                        />
                        <YAxis
                            domain={[0, 100]}
                            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                            axisLine={{ stroke: 'var(--border-color)' }}
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'var(--surface-2)', border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13,
                            }}
                            labelFormatter={(d) => new Date(d).toLocaleDateString('uk-UA')}
                            formatter={(v) => [v, 'Score']}
                        />
                        <Area
                            type="monotone"
                            dataKey="score"
                            stroke="var(--brand-500)"
                            strokeWidth={2}
                            fill="url(#scoreGrad)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

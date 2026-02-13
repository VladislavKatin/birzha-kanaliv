import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import './ChannelsPage.css';

function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
}

function getInfluenceScore(channel) {
    const subs = channel.subscribers || 0;
    const avgViews = channel.avgViews30d || 0;
    const engagement = subs > 0 ? (avgViews / subs) * 100 : 0;

    if (engagement > 20 && subs > 10000) return { score: 'A+', color: 'var(--score-a-plus)' };
    if (engagement > 10 && subs > 5000) return { score: 'A', color: 'var(--score-a)' };
    if (engagement > 5 && subs > 1000) return { score: 'B', color: 'var(--score-b)' };
    if (engagement > 2) return { score: 'C', color: 'var(--score-c)' };
    return { score: 'D', color: 'var(--score-d)' };
}

export default function ChannelDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadChannel = useCallback(async () => {
        try {
            const response = await api.get(`/channels/${id}`);
            setData(response.data);
        } catch (error) {
            console.error('Failed to load channel:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadChannel();
    }, [loadChannel]);

    async function handleRefresh() {
        setRefreshing(true);
        try {
            await api.post('/youtube/refresh');
            await loadChannel();
        } catch (error) {
            console.error('Refresh failed:', error);
        } finally {
            setRefreshing(false);
        }
    }

    async function handleToggleActive(isActive) {
        try {
            await api.put(`/channels/${id}`, { isActive });
            setData((prev) => ({ ...prev, channel: { ...prev.channel, isActive } }));
        } catch (error) {
            console.error('Toggle failed:', error);
        }
    }

    async function handleDelete() {
        if (!confirm('Видалити канал? Цю дію не можна скасувати.')) return;

        try {
            await api.delete(`/channels/${id}`);
            navigate('/my-channels');
        } catch (error) {
            console.error('Delete failed:', error);
        }
    }

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-pulse" />
                <p>Завантаження...</p>
            </div>
        );
    }

    if (!data?.channel) {
        return (
            <div className="channels-empty card">
                <h3>Канал не знайдено</h3>
                <button className="btn btn-secondary" onClick={() => navigate('/my-channels')}>
                    ← Назад
                </button>
            </div>
        );
    }

    const { channel, rating, swapHistory } = data;
    const influence = getInfluenceScore(channel);

    const chartData = Array.from({ length: 28 }, (_, index) => ({
        day: `Д${index + 1}`,
        subs: Math.max(
            0,
            (channel.subscribers || 0) - (channel.subGrowth30d || 0) + Math.round(((channel.subGrowth30d || 0) / 28) * (index + 1) + (Math.random() - 0.5) * 20),
        ),
    }));

    return (
        <div className="channel-detail-page">
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/my-channels')} style={{ marginBottom: 20 }}>
                ← Назад до каналів
            </button>

            <div className="channel-detail-header card">
                <img
                    src={channel.channelAvatar || `https://ui-avatars.com/api/?name=${channel.channelTitle}&background=4f46e5&color=fff`}
                    alt={channel.channelTitle}
                    className="channel-detail-avatar"
                />
                <div className="channel-detail-info">
                    <div className="channel-detail-name-row">
                        <h1>{channel.channelTitle}</h1>
                        <div className="influence-badge-lg" style={{ background: influence.color }}>
                            {influence.score}
                        </div>
                        {channel.verified && <span className="verified-badge">Верифікований</span>}
                    </div>
                    {channel.description && <p className="channel-detail-desc">{channel.description}</p>}
                    <div className="channel-detail-meta">
                        {channel.niche && <span className="meta-tag">{channel.niche}</span>}
                        {channel.language && <span className="meta-tag">{channel.language}</span>}
                        {channel.country && <span className="meta-tag">{channel.country}</span>}
                    </div>
                </div>
            </div>

            <div className="channel-detail-stats">
                <div className="detail-stat card">
                    <span className="detail-stat-value">{formatNumber(channel.subscribers)}</span>
                    <span className="detail-stat-label">Підписників</span>
                </div>
                <div className="detail-stat card">
                    <span className="detail-stat-value">{formatNumber(channel.totalViews)}</span>
                    <span className="detail-stat-label">Переглядів</span>
                </div>
                <div className="detail-stat card">
                    <span className="detail-stat-value">{formatNumber(channel.avgViews30d)}</span>
                    <span className="detail-stat-label">Сер. перегляди/30д</span>
                </div>
                <div className="detail-stat card">
                    <span className="detail-stat-value">{channel.subGrowth30d > 0 ? '+' : ''}{formatNumber(channel.subGrowth30d)}</span>
                    <span className="detail-stat-label">Ріст підписників/30д</span>
                </div>
                <div className="detail-stat card">
                    <span className="detail-stat-value">{channel.ctr ? `${channel.ctr.toFixed(1)}%` : '—'}</span>
                    <span className="detail-stat-label">CTR</span>
                </div>
                <div className="detail-stat card">
                    <span className="detail-stat-value">{rating?.average || 0} ★</span>
                    <span className="detail-stat-label">Рейтинг ({rating?.count || 0})</span>
                </div>
            </div>

            <div className="card" style={{ padding: 24 }}>
                <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>Динаміка підписників (28 днів)</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                        <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{
                                background: 'var(--surface-2)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-primary)',
                                fontSize: 13,
                            }}
                        />
                        <Line type="monotone" dataKey="subs" stroke="var(--brand-400)" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {channel.recentVideos && channel.recentVideos.length > 0 && (
                <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>Останні відео</h3>
                    <div className="recent-videos-list">
                        {channel.recentVideos.slice(0, 5).map((video, index) => (
                            <div key={index} className="recent-video-item">
                                {video.thumbnail && <img src={video.thumbnail} alt="" className="video-thumb" />}
                                <div className="video-info">
                                    <span className="video-title">{video.title || 'Без назви'}</span>
                                    <span className="video-stats">
                                        {formatNumber(video.views || 0)} переглядів • {formatNumber(video.likes || 0)} лайків
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {swapHistory && swapHistory.length > 0 && (
                <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>Історія обмінів</h3>
                    <div className="swap-history-list">
                        {swapHistory.map((swap) => {
                            const partner = swap.initiatorChannelId === channel.id ? swap.targetChannel : swap.initiatorChannel;
                            return (
                                <div key={swap.id} className="swap-history-item">
                                    <img src={partner?.channelAvatar || ''} alt="" className="swap-partner-avatar" />
                                    <div className="swap-partner-info">
                                        <span className="swap-partner-name">{partner?.channelTitle || 'Канал'}</span>
                                        <span className="swap-partner-subs">{formatNumber(partner?.subscribers || 0)} підписників</span>
                                    </div>
                                    <span className="swap-date">
                                        {swap.completedAt ? new Date(swap.completedAt).toLocaleDateString('uk-UA') : '—'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="channel-settings card">
                <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>Налаштування</h3>
                <div className="settings-row">
                    <label className="toggle-switch">
                        <input type="checkbox" checked={channel.isActive ?? true} onChange={(event) => handleToggleActive(event.target.checked)} />
                        <span className="toggle-slider" />
                        <span className="toggle-label">Активний для обміну</span>
                    </label>
                </div>
                <div className="settings-actions">
                    <button className="btn btn-secondary" onClick={handleRefresh} disabled={refreshing}>
                        {refreshing ? 'Оновлення...' : 'Оновити статистику'}
                    </button>
                    <button className="btn btn-danger" onClick={handleDelete}>
                        Видалити канал
                    </button>
                </div>
                {channel.lastAnalyticsUpdate && (
                    <p className="settings-note">Останнє оновлення: {new Date(channel.lastAnalyticsUpdate).toLocaleString('uk-UA')}</p>
                )}
            </div>
        </div>
    );
}


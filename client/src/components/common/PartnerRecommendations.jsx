import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { buildFallbackAvatar, handleAvatarError, resolveChannelAvatar } from '../../services/avatar';
import './PartnerRecommendations.css';

function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return String(num);
}

export default function PartnerRecommendations() {
    const [recs, setRecs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadRecs();
    }, []);

    async function loadRecs() {
        setLoadError('');
        try {
            const response = await api.get('/user/recommendations');
            setRecs(response.data.recommendations || []);
        } catch (error) {
            console.error('Failed to load recommendations:', error);
            setLoadError(error?.response?.data?.error || 'Не вдалося завантажити рекомендації.');
            setRecs([]);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return null;
    if (loadError) {
        return (
            <div className="partner-recs card">
                <h3>Рекомендовані партнери</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>{loadError}</p>
            </div>
        );
    }
    if (recs.length === 0) return null;

    const visibleRecs = recs.slice(0, 2);

    return (
        <div className="partner-recs card">
            <h3>Рекомендовані партнери</h3>
            <div className="recs-grid">
                {visibleRecs.map((channel) => (
                    <div key={channel.id} className="rec-card">
                        <img src={resolveChannelAvatar(channel.channelAvatar, channel.channelTitle)} data-fallback-src={buildFallbackAvatar(channel.channelTitle)} onError={handleAvatarError} alt={channel.channelTitle || 'Канал'} className="rec-avatar" />
                        <div className="rec-info">
                            <span className="rec-name">
                                {channel.verified && <span className="verified-dot">✓</span>}
                                {channel.channelTitle}
                            </span>
                            <span className="rec-subs">{formatNumber(channel.subscribers)} підп.</span>
                            {channel.niche && <span className="rec-niche">{channel.niche}</span>}
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => navigate('/offers')}>
                            Запропонувати
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

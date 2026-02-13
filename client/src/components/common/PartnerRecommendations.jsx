import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
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
    const navigate = useNavigate();

    useEffect(() => {
        loadRecs();
    }, []);

    async function loadRecs() {
        try {
            const response = await api.get('/user/recommendations');
            setRecs(response.data.recommendations || []);
        } catch (error) {
            console.error('Failed to load recommendations:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return null;
    if (recs.length === 0) return null;

    const visibleRecs = recs.slice(0, 2);

    return (
        <div className="partner-recs card">
            <h3>Рекомендовані партнери</h3>
            <div className="recs-grid">
                {visibleRecs.map((channel) => (
                    <div key={channel.id} className="rec-card">
                        <img src={channel.channelAvatar || ''} alt="" className="rec-avatar" />
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

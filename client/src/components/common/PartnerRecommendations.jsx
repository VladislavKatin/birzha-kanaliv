import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './PartnerRecommendations.css';

function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
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
            const res = await api.get('/user/recommendations');
            setRecs(res.data.recommendations || []);
        } catch (error) {
            console.error('Failed to load recommendations:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return null;
    if (recs.length === 0) return null;

    return (
        <div className="partner-recs card">
            <h3>🤝 Рекомендовані партнери</h3>
            <div className="recs-grid">
                {recs.map(ch => (
                    <div key={ch.id} className="rec-card">
                        <img src={ch.channelAvatar || ''} alt="" className="rec-avatar" />
                        <div className="rec-info">
                            <span className="rec-name">
                                {ch.verified && <span className="verified-dot">✅</span>}
                                {ch.channelTitle}
                            </span>
                            <span className="rec-subs">{formatNumber(ch.subscribers)} пд.</span>
                            {ch.niche && <span className="rec-niche">{ch.niche}</span>}
                        </div>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => navigate('/offers')}
                        >
                            Запропонувати
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

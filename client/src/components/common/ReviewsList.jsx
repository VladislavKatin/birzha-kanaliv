import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function ReviewsList({ channelIds }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReviews();
    }, [channelIds]);

    async function loadReviews() {
        if (!channelIds?.length) { setLoading(false); return; }
        try {
            // Load reviews for all channels
            const all = [];
            for (const cid of channelIds) {
                const res = await api.get(`/reviews/channel/${cid}`);
                all.push(...(res.data.reviews || []));
            }
            // Sort by date, deduplicate by id
            const unique = [];
            const seen = new Set();
            for (const r of all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))) {
                if (!seen.has(r.id)) { seen.add(r.id); unique.push(r); }
            }
            setReviews(unique);
        } catch (error) {
            console.error('Failed to load reviews:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Завантаження відгуків...</p>;
    if (reviews.length === 0) return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Ще немає відгуків</p>;

    return (
        <div className="reviews-list">
            {reviews.map(r => (
                <div key={r.id} className="review-item">
                    <div className="review-header">
                        <img
                            src={r.fromChannel?.channelAvatar || ''}
                            alt=""
                            className="review-avatar"
                        />
                        <div className="review-meta">
                            <span className="review-author">{r.fromChannel?.channelTitle || 'Канал'}</span>
                            <span className="review-date">{new Date(r.createdAt).toLocaleDateString('uk-UA')}</span>
                        </div>
                        <div className="review-stars">
                            {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                        </div>
                    </div>
                    {r.comment && <p className="review-text">{r.comment}</p>}
                </div>
            ))}
        </div>
    );
}

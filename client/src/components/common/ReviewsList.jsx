import { useState, useEffect } from 'react';
import api from '../../services/api';
import { buildFallbackAvatar, handleAvatarError, resolveChannelAvatar } from '../../services/avatar';
import { normalizeDisplayText } from '../../services/publicOffers';

function renderStars(rating) {
    const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
    return `${'★'.repeat(safeRating)}${'☆'.repeat(5 - safeRating)}`;
}

export default function ReviewsList({ channelIds }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function loadReviews() {
            if (!channelIds?.length) {
                if (!cancelled) {
                    setLoading(false);
                    setReviews([]);
                    setLoadError('');
                }
                return;
            }

            setLoading(true);
            setLoadError('');
            try {
                const all = [];
                for (const cid of channelIds) {
                    const res = await api.get(`/reviews/channel/${cid}`);
                    all.push(...(res.data.reviews || []));
                }

                const unique = [];
                const seen = new Set();
                for (const review of all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))) {
                    if (!seen.has(review.id)) {
                        seen.add(review.id);
                        unique.push(review);
                    }
                }

                if (!cancelled) {
                    setReviews(unique);
                }
            } catch (error) {
                console.error('Failed to load reviews:', error);
                if (!cancelled) {
                    setReviews([]);
                    setLoadError(error?.response?.data?.error || 'Не вдалося завантажити відгуки.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadReviews();

        return () => {
            cancelled = true;
        };
    }, [channelIds]);

    if (loading) return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Завантаження відгуків...</p>;
    if (loadError) return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{loadError}</p>;
    if (reviews.length === 0) return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Ще немає відгуків</p>;

    return (
        <div className="reviews-list">
            {reviews.map((review) => {
                const safeAuthor = normalizeDisplayText(review.fromChannel?.channelTitle, 'Канал');
                const safeComment = normalizeDisplayText(review.comment, '');

                return (
                    <div key={review.id} className="review-item">
                        <div className="review-header">
                            <img src={resolveChannelAvatar(review.fromChannel?.channelAvatar, safeAuthor)} data-fallback-src={buildFallbackAvatar(safeAuthor)} onError={handleAvatarError} alt={safeAuthor} className="review-avatar" />
                            <div className="review-meta">
                                <span className="review-author">{safeAuthor}</span>
                                <span className="review-date">{new Date(review.createdAt).toLocaleDateString('uk-UA')}</span>
                            </div>
                            <div className="review-stars">{renderStars(review.rating)}</div>
                        </div>
                        {safeComment && <p className="review-text">{safeComment}</p>}
                    </div>
                );
            })}
        </div>
    );
}

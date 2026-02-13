import './RatingBadge.css';

export default function RatingBadge({ rating, count, size = 'md' }) {
    if (!rating && !count) return null;

    const displayRating = typeof rating === 'number' ? rating.toFixed(1) : '0.0';
    const displayCount = typeof count === 'number' ? count : 0;

    return (
        <span className={`rating-badge rating-${size}`}>
            <span className="rating-value">{displayRating}</span>
            <span className="rating-star">★</span>
            {displayCount > 0 && <span className="rating-count">({displayCount})</span>}
        </span>
    );
}

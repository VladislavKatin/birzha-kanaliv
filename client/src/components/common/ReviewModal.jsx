import { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './ReviewModal.css';

export default function ReviewModal({ matchId, onClose, onSubmitted }) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit() {
        if (rating === 0) { toast.error('Оберіть оцінку'); return; }

        setSubmitting(true);
        try {
            await api.post('/reviews', { matchId, rating, comment: comment.trim() || null });
            toast.success('Відгук залишено!');
            if (onSubmitted) onSubmitted();
            onClose();
        } catch (error) {
            const msg = error.response?.data?.error || 'Не вдалося залишити відгук';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    }

    const displayRating = hoverRating || rating;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content review-modal" onClick={e => e.stopPropagation()}>
                <h3>⭐ Залишити відгук</h3>

                <div className="star-rating">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button
                            key={star}
                            className={`star-btn ${star <= displayRating ? 'active' : ''}`}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                        >
                            ★
                        </button>
                    ))}
                    <span className="rating-label">
                        {displayRating === 1 && 'Погано'}
                        {displayRating === 2 && 'Нижче середнього'}
                        {displayRating === 3 && 'Нормально'}
                        {displayRating === 4 && 'Добре'}
                        {displayRating === 5 && 'Відмінно!'}
                    </span>
                </div>

                <textarea
                    className="form-textarea review-textarea"
                    rows={4}
                    placeholder="Коментар (необов'язково)..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                />

                <p className="review-notice">ℹ️ Відгук стане публічним через 7 днів</p>

                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onClose}>Скасувати</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || rating === 0}>
                        {submitting ? 'Надсилаю...' : 'Надіслати відгук'}
                    </button>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './ExchangesPage.css';

function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
}

export default function ExchangesPage() {
    const [exchanges, setExchanges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviewForm, setReviewForm] = useState(null);

    useEffect(() => {
        loadExchanges();
    }, []);

    async function loadExchanges() {
        try {
            const response = await api.get('/exchanges');
            setExchanges(response.data.exchanges || []);
        } catch (error) {
            console.error('Failed to load exchanges:', error);
        } finally {
            setLoading(false);
        }
    }

    async function submitReview() {
        if (!reviewForm) return;

        try {
            await api.post('/reviews', {
                matchId: reviewForm.exchangeId,
                toChannelId: reviewForm.toChannelId,
                fromChannelId: reviewForm.fromChannelId,
                rating: reviewForm.rating,
                comment: reviewForm.comment,
            });
            toast.success('Відгук надіслано!');
            setReviewForm(null);
            loadExchanges();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Не вдалося надіслати відгук');
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

    return (
        <div className="exchanges-page">
            <div className="exchanges-header">
                <h1>Завершені обміни</h1>
                <p className="exchanges-subtitle">Історія ваших успішних обмінів трафіком</p>
            </div>

            {exchanges.length === 0 ? (
                <div className="swaps-empty card">
                    <span className="swaps-empty-icon">📋</span>
                    <h3>Ще немає завершених обмінів</h3>
                    <p>Прийміть свою першу пропозицію обміну трафіком</p>
                </div>
            ) : (
                <div className="exchanges-list">
                    {exchanges.map((exchange) => (
                        <div key={exchange.id} className="exchange-item card">
                            <div className="exchange-partner">
                                <img src={exchange.partner?.channelAvatar || ''} alt="" className="exchange-partner-avatar" />
                                <div className="exchange-partner-info">
                                    <span className="exchange-partner-name">{exchange.partner?.channelTitle || 'Канал'}</span>
                                    <span className="exchange-partner-subs">{formatNumber(exchange.partner?.subscribers)} підписників</span>
                                </div>
                            </div>

                            <div className="exchange-meta">
                                {exchange.offer && (
                                    <span className="exchange-type">
                                        {exchange.offer.type === 'subs' ? 'Підписники' : 'Перегляди'}
                                    </span>
                                )}
                                <span className="exchange-date">
                                    {exchange.completedAt ? new Date(exchange.completedAt).toLocaleDateString('uk-UA') : '—'}
                                </span>
                            </div>

                            <div className="exchange-actions">
                                {exchange.hasReviewed ? (
                                    <span className="exchange-reviewed">Відгук залишено</span>
                                ) : (
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() =>
                                            setReviewForm({
                                                exchangeId: exchange.id,
                                                toChannelId: exchange.partner?.id,
                                                fromChannelId: exchange.myChannelId,
                                                partnerName: exchange.partner?.channelTitle,
                                                rating: 5,
                                                comment: '',
                                            })
                                        }
                                    >
                                        Залишити відгук
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {reviewForm && (
                <div className="modal-overlay" onClick={() => setReviewForm(null)}>
                    <div className="modal-content review-modal" onClick={(event) => event.stopPropagation()}>
                        <h3>Відгук про {reviewForm.partnerName}</h3>

                        <div className="review-rating">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    className={`star-btn ${star <= reviewForm.rating ? 'active' : ''}`}
                                    onClick={() => setReviewForm((prev) => ({ ...prev, rating: star }))}
                                >
                                    ★
                                </button>
                            ))}
                        </div>

                        <textarea
                            className="review-textarea"
                            placeholder="Ваш коментар (необов'язково)..."
                            value={reviewForm.comment}
                            onChange={(event) => setReviewForm((prev) => ({ ...prev, comment: event.target.value }))}
                            rows={4}
                        />

                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setReviewForm(null)}>
                                Скасувати
                            </button>
                            <button className="btn btn-primary" onClick={submitReview}>
                                Надіслати відгук
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

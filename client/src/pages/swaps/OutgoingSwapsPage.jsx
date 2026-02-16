import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { buildFallbackAvatar, handleAvatarError, resolveChannelAvatar } from '../../services/avatar';
import './SwapsPage.css';

const completionChecklistDefaults = {
    checkPublished: false,
    checkEvidence: false,
    checkAgreement: false,
};

function getApiErrorMessage(error, fallbackMessage) {
    return error?.response?.data?.error || fallbackMessage;
}

function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
}

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Щойно';
    if (hours < 24) return `${hours} год тому`;
    const days = Math.floor(hours / 24);
    return `${days} дн тому`;
}

function formatDeadline(value) {
    if (!value) return '';
    return new Date(value).toLocaleString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

const statusLabels = {
    pending: { text: 'Очікує', color: '#f59e0b' },
    accepted: { text: 'Прийнято', color: '#22c55e' },
    completed: { text: 'Завершено', color: '#22c55e' },
};

export default function OutgoingSwapsPage() {
    const navigate = useNavigate();
    const [swaps, setSwaps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [processing, setProcessing] = useState(null);
    const [completeState, setCompleteState] = useState({
        swapId: '',
        checks: { ...completionChecklistDefaults },
        submitting: false,
    });
    const [reviewState, setReviewState] = useState({
        swapId: '',
        rating: 5,
        comment: '',
        submitting: false,
    });

    useEffect(() => {
        loadSwaps();
    }, []);

    async function loadSwaps() {
        setLoadError('');
        try {
            const response = await api.get('/swaps/outgoing');
            setSwaps(response.data.swaps || []);
        } catch (loadSwapsError) {
            console.error('Failed to load outgoing swaps:', loadSwapsError);
            const message = getApiErrorMessage(loadSwapsError, 'Не вдалося завантажити вихідні запити.');
            setLoadError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }

    async function handleCancel(swapId) {
        try {
            await api.post(`/swaps/${swapId}/decline`);
            toast.success('Пропозицію скасовано');
            setSwaps((prev) => prev.filter((item) => item.id !== swapId));
        } catch (cancelError) {
            toast.error(getApiErrorMessage(cancelError, 'Не вдалося скасувати пропозицію'));
        }
    }

    function openCompleteChecklist(swapId) {
        setCompleteState({
            swapId,
            checks: { ...completionChecklistDefaults },
            submitting: false,
        });
    }

    async function handleCompleteSubmit() {
        if (!completeState.swapId) return;
        const allChecked = Object.values(completeState.checks).every(Boolean);
        if (!allChecked) {
            toast.error('Підтвердіть усі пункти чек-листа');
            return;
        }

        setCompleteState((prev) => ({ ...prev, submitting: true }));
        setProcessing(completeState.swapId);
        try {
            const response = await api.post(`/chat/${completeState.swapId}/complete`);
            const completed = response.data?.match?.status === 'completed';
            toast.success(completed ? 'Обмін завершено' : 'Підтверджено, очікуємо партнера');
            setCompleteState({ swapId: '', checks: { ...completionChecklistDefaults }, submitting: false });
            await loadSwaps();
        } catch (error) {
            toast.error(error?.response?.data?.error || 'Не вдалося підтвердити обмін');
            setCompleteState((prev) => ({ ...prev, submitting: false }));
        } finally {
            setProcessing(null);
        }
    }

    function openReviewModal(swapId) {
        setReviewState({
            swapId,
            rating: 5,
            comment: '',
            submitting: false,
        });
    }

    async function submitReview() {
        if (!reviewState.swapId) return;
        setReviewState((prev) => ({ ...prev, submitting: true }));
        try {
            await api.post('/reviews', {
                matchId: reviewState.swapId,
                rating: reviewState.rating,
                comment: reviewState.comment.trim(),
            });
            toast.success('Відгук збережено');
            setSwaps((prev) => prev.map((swap) => (swap.id === reviewState.swapId ? { ...swap, hasReviewed: true } : swap)));
            setReviewState({ swapId: '', rating: 5, comment: '', submitting: false });
        } catch (error) {
            toast.error(error?.response?.data?.error || 'Не вдалося зберегти відгук');
            setReviewState((prev) => ({ ...prev, submitting: false }));
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

    if (loadError && swaps.length === 0) {
        return (
            <div className="swaps-page">
                <div className="swaps-empty card">
                    <span className="swaps-empty-icon">!</span>
                    <h3>Помилка завантаження</h3>
                    <p>{loadError}</p>
                    <button className="btn btn-secondary btn-sm" onClick={loadSwaps}>
                        Спробувати ще раз
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="swaps-page">
            <div className="swaps-header">
                <h1>Вихідні запити</h1>
                <p className="swaps-subtitle">Ваші відгуки на пропозиції обміну</p>
            </div>

            {swaps.length === 0 ? (
                <div className="swaps-empty card">
                    <span className="swaps-empty-icon">📤</span>
                    <h3>Немає вихідних пропозицій</h3>
                    <p>
                        Знайдіть партнера в{' '}
                        <button className="link-btn" onClick={() => navigate('/offers')}>
                            каталозі пропозицій
                        </button>
                    </p>
                </div>
            ) : (
                <div className="swaps-list">
                    {swaps.map((swap) => {
                        const status = statusLabels[swap.status] || statusLabels.pending;
                        return (
                            <div key={swap.id} className="swap-item card">
                                <div className="swap-item-channel">
                                    <img
                                        src={resolveChannelAvatar(swap.targetChannel?.channelAvatar, swap.targetChannel?.channelTitle)}
                                        data-fallback-src={buildFallbackAvatar(swap.targetChannel?.channelTitle)}
                                        onError={handleAvatarError}
                                        alt={swap.targetChannel?.channelTitle || 'Канал'}
                                        className="swap-item-avatar"
                                    />
                                    <div className="swap-item-info">
                                        <span className="swap-item-name">{swap.targetChannel?.channelTitle || 'Канал'}</span>
                                        <span className="swap-item-subs">{formatNumber(swap.targetChannel?.subscribers)} підписників</span>
                                    </div>
                                </div>

                                <div className="swap-item-details">
                                    <div className="swap-status-badge" style={{ color: status.color, borderColor: status.color }}>
                                        {status.text}
                                    </div>
                                    {swap.responseDeadlineAt && (
                                        <span className={`swap-sla ${swap.isOverdue ? 'overdue' : ''}`}>
                                            Дедлайн відповіді: {formatDeadline(swap.responseDeadlineAt)}
                                        </span>
                                    )}
                                    {swap.completionDeadlineAt && (
                                        <span className={`swap-sla ${swap.isOverdue ? 'overdue' : ''}`}>
                                            Дедлайн завершення: {formatDeadline(swap.completionDeadlineAt)}
                                        </span>
                                    )}
                                    <span className="swap-item-time">{timeAgo(swap.createdAt)}</span>
                                </div>

                                <div className="swap-item-actions">
                                    {swap.status === 'accepted' ? (
                                        <>
                                            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/support/chats?thread=match-${swap.id}`)}>
                                                Повідомлення
                                            </button>
                                            <button className="btn btn-primary btn-sm" onClick={() => openCompleteChecklist(swap.id)} disabled={processing === swap.id}>
                                                Обмін завершено
                                            </button>
                                        </>
                                    ) : swap.status === 'completed' ? (
                                        swap.hasReviewed ? (
                                            <span className="swap-status-badge" style={{ color: '#64748b', borderColor: '#64748b' }}>
                                                Відгук залишено
                                            </span>
                                        ) : (
                                            <button className="btn btn-primary btn-sm" onClick={() => openReviewModal(swap.id)}>
                                                Залишити відгук
                                            </button>
                                        )
                                    ) : (
                                        <button className="btn btn-secondary btn-sm" onClick={() => handleCancel(swap.id)}>
                                            Скасувати
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {completeState.swapId && (
                <div className="auth-required-modal" role="dialog" aria-modal="true">
                    <div className="auth-required-card">
                        <h3>Чек-лист завершення обміну</h3>
                        <p>Підтвердьте, що умови виконані з обох сторін.</p>
                        <label className="modal-checkline">
                            <input
                                type="checkbox"
                                checked={completeState.checks.checkPublished}
                                onChange={(event) =>
                                    setCompleteState((prev) => ({
                                        ...prev,
                                        checks: { ...prev.checks, checkPublished: event.target.checked },
                                    }))
                                }
                            />
                            <span>Публікація/дія за обміном виконана</span>
                        </label>
                        <label className="modal-checkline">
                            <input
                                type="checkbox"
                                checked={completeState.checks.checkEvidence}
                                onChange={(event) =>
                                    setCompleteState((prev) => ({
                                        ...prev,
                                        checks: { ...prev.checks, checkEvidence: event.target.checked },
                                    }))
                                }
                            />
                            <span>Підтвердження додані в чат</span>
                        </label>
                        <label className="modal-checkline">
                            <input
                                type="checkbox"
                                checked={completeState.checks.checkAgreement}
                                onChange={(event) =>
                                    setCompleteState((prev) => ({
                                        ...prev,
                                        checks: { ...prev.checks, checkAgreement: event.target.checked },
                                    }))
                                }
                            />
                            <span>Партнер погодив завершення</span>
                        </label>
                        <div className="auth-required-actions">
                            <button
                                type="button"
                                onClick={() => setCompleteState({ swapId: '', checks: { ...completionChecklistDefaults }, submitting: false })}
                                disabled={completeState.submitting}
                            >
                                Скасувати
                            </button>
                            <button type="button" className="primary" onClick={handleCompleteSubmit} disabled={completeState.submitting}>
                                Підтвердити завершення
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {reviewState.swapId && (
                <div className="auth-required-modal" role="dialog" aria-modal="true">
                    <div className="auth-required-card">
                        <h3>Залишити відгук</h3>
                        <p>Оцініть обмін, щоб підвищити якість рекомендацій.</p>
                        <label className="review-label" htmlFor="outgoing-review-rating">Оцінка</label>
                        <select
                            id="outgoing-review-rating"
                            className="filter-select"
                            value={reviewState.rating}
                            onChange={(event) => setReviewState((prev) => ({ ...prev, rating: Number(event.target.value) }))}
                            disabled={reviewState.submitting}
                        >
                            <option value={5}>5 — Відмінно</option>
                            <option value={4}>4 — Добре</option>
                            <option value={3}>3 — Нормально</option>
                            <option value={2}>2 — Слабо</option>
                            <option value={1}>1 — Погано</option>
                        </select>
                        <textarea
                            className="decline-comment"
                            rows={3}
                            placeholder="Коментар (необов'язково)"
                            value={reviewState.comment}
                            onChange={(event) => setReviewState((prev) => ({ ...prev, comment: event.target.value }))}
                            disabled={reviewState.submitting}
                        />
                        <div className="auth-required-actions">
                            <button
                                type="button"
                                onClick={() => setReviewState({ swapId: '', rating: 5, comment: '', submitting: false })}
                                disabled={reviewState.submitting}
                            >
                                Скасувати
                            </button>
                            <button type="button" className="primary" onClick={submitReview} disabled={reviewState.submitting}>
                                Зберегти відгук
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

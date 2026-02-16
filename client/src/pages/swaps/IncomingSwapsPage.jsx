import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { buildFallbackAvatar, handleAvatarError, resolveChannelAvatar } from '../../services/avatar';
import './SwapsPage.css';

const declineReasonOptions = [
    { value: 'Невідповідна ніша', label: 'Невідповідна ніша' },
    { value: 'Замала аудиторія', label: 'Замала аудиторія' },
    { value: 'Невідповідний формат обміну', label: 'Невідповідний формат обміну' },
    { value: 'Немає часу зараз', label: 'Немає часу зараз' },
    { value: 'Інша причина', label: 'Інша причина' },
];

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

function getPendingHours(dateStr) {
    return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000));
}

function getUrgencyLabel(swap) {
    if (swap.status !== 'pending') return null;
    const hours = getPendingHours(swap.createdAt);
    if (hours >= 72) return { className: 'swap-urgency high', text: 'Терміново' };
    if (hours >= 24) return { className: 'swap-urgency medium', text: 'Сьогодні' };
    return { className: 'swap-urgency low', text: 'Новий' };
}

export default function IncomingSwapsPage() {
    const navigate = useNavigate();
    const [swaps, setSwaps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [filters, setFilters] = useState({ status: 'all', sort: 'newest', search: '' });
    const [declineState, setDeclineState] = useState({
        swapId: '',
        reason: declineReasonOptions[0].value,
        comment: '',
        isSubmitting: false,
    });

    const loadSwaps = useCallback(async () => {
        setLoadError('');
        try {
            const params = new URLSearchParams();
            if (filters.status && filters.status !== 'all') params.set('status', filters.status);
            if (filters.sort) params.set('sort', filters.sort);
            if (filters.search.trim()) params.set('search', filters.search.trim());

            const response = await api.get(`/swaps/incoming?${params.toString()}`);
            setSwaps(response.data.swaps || []);
        } catch (loadSwapsError) {
            console.error('Failed to load incoming swaps:', loadSwapsError);
            const message = getApiErrorMessage(loadSwapsError, 'Не вдалося завантажити вхідні запити.');
            setLoadError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [filters.status, filters.sort, filters.search]);

    useEffect(() => {
        loadSwaps();
    }, [loadSwaps]);

    async function handleAccept(swapId) {
        setProcessing(swapId);
        try {
            await api.post(`/swaps/${swapId}/accept`);
            toast.success('Пропозицію прийнято! Відкриваємо повідомлення...');
            await loadSwaps();
            navigate(`/support/chats?thread=match-${swapId}`);
        } catch (acceptError) {
            toast.error(getApiErrorMessage(acceptError, 'Не вдалося прийняти пропозицію'));
        } finally {
            setProcessing(null);
        }
    }

    function handleDecline(swapId) {
        setDeclineState((prev) => ({
            ...prev,
            swapId,
            reason: declineReasonOptions[0].value,
            comment: '',
            isSubmitting: false,
        }));
    }

    async function handleDeclineSubmit() {
        if (!declineState.swapId) {
            return;
        }

        const reason = declineState.comment.trim()
            ? `${declineState.reason}: ${declineState.comment.trim()}`
            : declineState.reason;

        setDeclineState((prev) => ({ ...prev, isSubmitting: true }));
        setProcessing(declineState.swapId);
        try {
            await api.post(`/swaps/${declineState.swapId}/decline`, { reason });
            toast.success('Пропозицію відхилено');
            setSwaps((prev) => prev.filter((item) => item.id !== declineState.swapId));
            setDeclineState({
                swapId: '',
                reason: declineReasonOptions[0].value,
                comment: '',
                isSubmitting: false,
            });
        } catch (declineError) {
            toast.error(getApiErrorMessage(declineError, 'Не вдалося відхилити пропозицію'));
            setDeclineState((prev) => ({ ...prev, isSubmitting: false }));
        } finally {
            setProcessing(null);
        }
    }

    async function handleComplete(swapId) {
        setProcessing(swapId);
        try {
            const response = await api.post(`/chat/${swapId}/complete`);
            const completed = response.data?.match?.status === 'completed';
            toast.success(completed ? 'Обмін завершено' : 'Підтверджено, очікуємо партнера');
            await loadSwaps();
        } catch (error) {
            toast.error(error?.response?.data?.error || 'Не вдалося підтвердити обмін');
        } finally {
            setProcessing(null);
        }
    }

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-pulse" />
                <p>Завантаження пропозицій...</p>
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
                <h1>Вхідні запити</h1>
                <p className="swaps-subtitle">Канали, які хочуть обмінятися трафіком з вами</p>
            </div>

            <div className="swaps-controls card">
                <select
                    className="filter-select"
                    value={filters.status}
                    onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
                >
                    <option value="all">Усі статуси</option>
                    <option value="pending">Очікують</option>
                    <option value="accepted">Прийняті</option>
                    <option value="completed">Завершені</option>
                </select>
                <select
                    className="filter-select"
                    value={filters.sort}
                    onChange={(event) => setFilters((prev) => ({ ...prev, sort: event.target.value }))}
                >
                    <option value="newest">Найновіші</option>
                    <option value="largest">Найбільші канали</option>
                    <option value="relevance">Найрелевантніші</option>
                </select>
                <input
                    className="filter-input"
                    type="text"
                    placeholder="Пошук за назвою, ID або описом"
                    value={filters.search}
                    onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                />
            </div>

            {swaps.length === 0 ? (
                <div className="swaps-empty card">
                    <span className="swaps-empty-icon">📭</span>
                    <h3>Немає вхідних пропозицій</h3>
                    <p>Коли хтось захоче обмінятися з вашим каналом, ви побачите це тут</p>
                </div>
            ) : (
                <div className="swaps-list">
                    {swaps.map((swap) => {
                        const urgency = getUrgencyLabel(swap);

                        return (
                            <div key={swap.id} className="swap-item card">
                                <div className="swap-item-channel">
                                    <img
                                        src={resolveChannelAvatar(swap.initiatorChannel?.channelAvatar, swap.initiatorChannel?.channelTitle)}
                                        data-fallback-src={buildFallbackAvatar(swap.initiatorChannel?.channelTitle)}
                                        onError={handleAvatarError}
                                        alt={swap.initiatorChannel?.channelTitle || 'Канал'}
                                        className="swap-item-avatar"
                                    />
                                    <div className="swap-item-info">
                                        <span className="swap-item-name">{swap.initiatorChannel?.channelTitle || 'Канал'}</span>
                                        <span className="swap-item-subs">{formatNumber(swap.initiatorChannel?.subscribers)} підписників</span>
                                        {swap.initiatorChannel?.niche && <span className="swap-item-niche">{swap.initiatorChannel.niche}</span>}
                                        {swap.status === 'pending' && (
                                            <span className="swap-item-age">Очікує {getPendingHours(swap.createdAt)} год</span>
                                        )}
                                    </div>
                                </div>

                                <div className="swap-item-details">
                                    {urgency && <span className={urgency.className}>{urgency.text}</span>}
                                    <span className="swap-item-type">
                                        Тип: {swap.offer?.type === 'subs' ? 'Підписники' : 'Перегляди'}
                                    </span>
                                    {swap.offer?.description && <p className="swap-item-desc">{swap.offer.description}</p>}
                                    <span className="swap-item-time">{timeAgo(swap.createdAt)}</span>
                                </div>

                                <div className="swap-item-actions">
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => navigate(`/offers/${swap.offerId}`)}
                                        disabled={!swap.offerId}
                                    >
                                        Переглянути канал
                                    </button>
                                    {swap.status === 'pending' && (
                                        <>
                                            <button className="btn btn-primary btn-sm" onClick={() => handleAccept(swap.id)} disabled={processing === swap.id}>
                                                Прийняти
                                            </button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDecline(swap.id)} disabled={processing === swap.id}>
                                                Відхилити
                                            </button>
                                        </>
                                    )}
                                    {swap.status === 'accepted' && (
                                        <>
                                            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/support/chats?thread=match-${swap.id}`)}>
                                                Повідомлення
                                            </button>
                                            <button className="btn btn-primary btn-sm" onClick={() => handleComplete(swap.id)} disabled={processing === swap.id}>
                                                Обмін завершено
                                            </button>
                                        </>
                                    )}
                                    {swap.status === 'completed' && (
                                        <>
                                            <span className="swap-status-badge" style={{ color: '#22c55e', borderColor: '#22c55e' }}>
                                                Завершено
                                            </span>
                                            {swap.hasReviewed ? (
                                                <span className="swap-status-badge" style={{ color: '#64748b', borderColor: '#64748b' }}>
                                                    Відгук залишено
                                                </span>
                                            ) : (
                                                <button className="btn btn-primary btn-sm" onClick={() => navigate('/exchanges')}>
                                                    Залишити відгук
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {declineState.swapId && (
                <div className="auth-required-modal" role="dialog" aria-modal="true">
                    <div className="auth-required-card">
                        <h3>Причина відхилення</h3>
                        <p>Це допоможе покращити рекомендації та аналітику обмінів.</p>
                        <select
                            className="filter-select"
                            value={declineState.reason}
                            onChange={(event) => setDeclineState((prev) => ({ ...prev, reason: event.target.value }))}
                            disabled={declineState.isSubmitting}
                        >
                            {declineReasonOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <textarea
                            className="decline-comment"
                            rows={3}
                            placeholder="Деталі (необов'язково)"
                            value={declineState.comment}
                            onChange={(event) => setDeclineState((prev) => ({ ...prev, comment: event.target.value }))}
                            disabled={declineState.isSubmitting}
                        />
                        <div className="auth-required-actions">
                            <button
                                type="button"
                                onClick={() =>
                                    setDeclineState({
                                        swapId: '',
                                        reason: declineReasonOptions[0].value,
                                        comment: '',
                                        isSubmitting: false,
                                    })
                                }
                                disabled={declineState.isSubmitting}
                            >
                                Скасувати
                            </button>
                            <button type="button" className="primary" onClick={handleDeclineSubmit} disabled={declineState.isSubmitting}>
                                Підтвердити відхилення
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}



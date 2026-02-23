import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
const completionChecklistDefaults = {
    checkPublished: false,
    checkEvidence: false,
    checkAgreement: false,
};
const PAGE_LIMIT = 12;
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

function formatPercent(value) {
    return `${Math.max(0, Number(value || 0))}%`;
}

function formatRating(value) {
    const num = Number(value || 0);
    return num > 0 ? num.toFixed(1) : '0.0';
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

function formatSlaHint(swap) {
    if (swap.status === 'pending' && Number.isFinite(swap.hoursLeft)) {
        if (swap.isOverdue) {
            return `Прострочено на ${Math.abs(swap.hoursLeft)} год`;
        }
        return `Залишилось ${Math.max(0, swap.hoursLeft)} год`;
    }
    if (swap.status === 'accepted' && Number.isFinite(swap.daysLeft)) {
        if (swap.isOverdue) {
            return `Прострочено на ${Math.abs(swap.daysLeft)} дн`;
        }
        return `Залишилось ${Math.max(0, swap.daysLeft)} дн`;
    }
    return '';
}

function isCanceledRequest(error) {
    return error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED';
}

function isSelectableSwap(swap) {
    return ['pending', 'accepted'].includes(swap.status);
}
export default function OutgoingSwapsPage() {
    const navigate = useNavigate();
    const [swaps, setSwaps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [filters, setFilters] = useState({ status: 'all', sort: 'newest', search: '' });
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: PAGE_LIMIT,
        total: 0,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
    });
    const [declineState, setDeclineState] = useState({
        swapId: '',
        reason: declineReasonOptions[0].value,
        comment: '',
        isSubmitting: false,
        });
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkBusy, setBulkBusy] = useState(false);
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
    const [bulkConfirm, setBulkConfirm] = useState({ open: false, action: '' });
    const abortRef = useRef(null);

    const loadSwaps = useCallback(async () => {
        setLoadError('');
        try {
            if (abortRef.current) {
                abortRef.current.abort();
            }
            const controller = new AbortController();
            abortRef.current = controller;

            const params = new URLSearchParams();
            if (filters.status && filters.status !== 'all') params.set('status', filters.status);
            if (filters.sort) params.set('sort', filters.sort);
            if (filters.search.trim()) params.set('search', filters.search.trim());
            params.set('page', String(page));
            params.set('limit', String(PAGE_LIMIT));

            const response = await api.get(`/swaps/outgoing?${params.toString()}`, {
                signal: controller.signal,
            });
            setSwaps(response.data.swaps || []);
            if (response.data?.pagination) {
                setPagination(response.data.pagination);
                if (response.data.pagination.page !== page) {
                    setPage(response.data.pagination.page);
                }
            } else {
                const total = Array.isArray(response.data.swaps) ? response.data.swaps.length : 0;
                setPagination({
                    page,
                    limit: PAGE_LIMIT,
                    total,
                    totalPages: 1,
                    hasNext: false,
                    hasPrev: false,
                });
            }
        } catch (loadSwapsError) {
            if (isCanceledRequest(loadSwapsError)) {
                return;
            }
            console.error('Failed to load outgoing swaps:', loadSwapsError);
            const message = getApiErrorMessage(loadSwapsError, 'Не вдалося завантажити вихідні запити.');
            setLoadError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [filters.status, filters.sort, filters.search, page]);

    useEffect(() => {
        loadSwaps();
    }, [loadSwaps]);
    useEffect(() => () => abortRef.current?.abort(), []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setFilters((prev) => {
                const normalized = searchInput.trim();
                if (prev.search === normalized) return prev;
                return { ...prev, search: normalized };
            });
            setPage(1);
        }, 350);
        return () => clearTimeout(timeoutId);
    }, [searchInput]);
    const selectableIds = useMemo(() => swaps.filter((swap) => isSelectableSwap(swap)).map((swap) => swap.id), [swaps]);
    const selectedCount = selectedIds.length;



    function toggleSelected(swapId) {
        setSelectedIds((prev) =>
            prev.includes(swapId) ? prev.filter((id) => id !== swapId) : [...prev, swapId]
        );
    }

    function toggleSelectAll() {
        setSelectedIds((prev) => (prev.length === selectableIds.length ? [] : [...selectableIds]));
    }

    function handleBulkAction(action) {
        if (!selectedIds.length) {
            toast.error('Оберіть хоча б один запит');
            return;
        }
        setBulkConfirm({ open: true, action });
    }

    async function executeBulkAction() {
        const action = bulkConfirm.action;
        if (!action) return;
        const reason = action === 'decline' ? 'Масове скасування вихідних запитів' : 'Масово відкладено з вихідних запитів';

        setBulkBusy(true);
        try {
            const response = await api.post('/swaps/bulk-action', {
                action,
                matchIds: selectedIds,
                reason,
            });

            const processedCount = Array.isArray(response.data?.processed) ? response.data.processed.length : 0;
            const skippedCount = Array.isArray(response.data?.skipped) ? response.data.skipped.length : 0;

            if (action === 'decline') {
                setSwaps((prev) => prev.filter((swap) => !selectedIds.includes(swap.id)));
            } else {
                setSwaps((prev) =>
                    prev.map((swap) => (selectedIds.includes(swap.id) ? { ...swap, deferredByMe: true } : swap))
                );
            }
            setSelectedIds([]);
            toast.success(`Масова дія виконана: ${processedCount}, пропущено: ${skippedCount}`);
            setBulkConfirm({ open: false, action: '' });
        } catch (error) {
            toast.error(error?.response?.data?.error || 'Не вдалося виконати масову дію');
        } finally {
            setBulkBusy(false);
        }
    }
    function openCancelModal(swapId) {
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
            toast.success('Пропозицію скасовано');
            setSwaps((prev) => prev.filter((item) => item.id !== declineState.swapId));
            setSelectedIds((prev) => prev.filter((id) => id !== declineState.swapId));
            setDeclineState({
                swapId: '',
                reason: declineReasonOptions[0].value,
                comment: '',
                isSubmitting: false,
            });
        } catch (declineError) {
            toast.error(getApiErrorMessage(declineError, 'Не вдалося скасувати пропозицію'));
            setDeclineState((prev) => ({ ...prev, isSubmitting: false }));
        } finally {
            setProcessing(null);
        }
    }

    async function openCompleteChecklist(swapId) {
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

    async function handleDefer(swapId) {
        setProcessing(swapId);
        try {
            const response = await api.post(`/swaps/${swapId}/defer`, {
                note: 'Відкладено користувачем з вихідних запитів',
            });
            const deferredUntil = response.data?.deferredUntil;
            toast.success(deferredUntil ? `Відкладено до ${new Date(deferredUntil).toLocaleString('uk-UA')}` : 'Відкладено');
            setSwaps((prev) => prev.map((item) => (item.id === swapId ? { ...item, deferredByMe: true } : item)));
        } catch (error) {
            toast.error(error?.response?.data?.error || 'Не вдалося відкласти обмін');
        } finally {
            setProcessing(null);
        }
    }

    function openMatchChatWithPrefill(swapId, messageText) {
        const prefill = encodeURIComponent(messageText);
        navigate(`/support/chats?thread=match-${swapId}&prefill=${prefill}`);
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
                <h1>Вихідні запити</h1>
                <p className="swaps-subtitle">Ваші надіслані запити на обмін</p>
            </div>

            <div className="swaps-controls card">
                <select
                    className="filter-select"
                    value={filters.status}
                    onChange={(event) => {
                        setPage(1);
                        setFilters((prev) => ({ ...prev, status: event.target.value }));
                    }}
                >
                    <option value="all">Усі статуси</option>
                    <option value="pending">Очікують</option>
                    <option value="accepted">Прийняті</option>
                    <option value="completed">Завершені</option>
                </select>
                <select
                    className="filter-select"
                    value={filters.sort}
                    onChange={(event) => {
                        setPage(1);
                        setFilters((prev) => ({ ...prev, sort: event.target.value }));
                    }}
                >
                    <option value="newest">Найновіші</option>
                    <option value="largest">Найбільші канали</option>
                    <option value="relevance">Найрелевантніші</option>
                </select>
                <input
                    className="filter-input"
                    type="text"
                    placeholder="Пошук за назвою, ID або описом"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                />
            </div>
            {selectableIds.length > 0 && (
                <div className="swaps-bulk card">
                    <label className="swaps-bulk-selectall">
                        <input
                            type="checkbox"
                            checked={selectedCount > 0 && selectedCount === selectableIds.length}
                            onChange={toggleSelectAll}
                        />
                        <span>Обрати всі</span>
                    </label>
                    <span className="swaps-bulk-count">Обрано: {selectedCount}</span>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleBulkAction('defer')}
                        disabled={!selectedCount || bulkBusy}
                    >
                        Масово відкласти
                    </button>
                    <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleBulkAction('decline')}
                        disabled={!selectedCount || bulkBusy}
                    >
                        Масово скасувати
                    </button>
                </div>
            )}

            {swaps.length === 0 ? (
                <div className="swaps-empty card">
                    <span className="swaps-empty-icon">📤</span>
                    <h3>Немає вихідних пропозицій</h3>
                    <p>
                        Знайдіть партнера в{' '}
                        <button className="link-btn" onClick={() => navigate('/dashboard/offers')}>
                            каталозі пропозицій
                        </button>
                    </p>
                </div>
            ) : (
                <div className="swaps-list">
                    {swaps.map((swap) => {
                        const urgency = getUrgencyLabel(swap);

                        return (
                            <div key={swap.id} className="swap-item card">
                                <div className="swap-item-channel">
                                    {isSelectableSwap(swap) && (
                                        <label className="swap-selectbox">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(swap.id)}
                                                onChange={() => toggleSelected(swap.id)}
                                            />
                                        </label>
                                    )}
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
                                        {swap.targetChannel?.niche && <span className="swap-item-niche">{swap.targetChannel.niche}</span>}
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
                                    {swap.compatibility && (
                                        <div className="swap-compatibility">
                                            <strong>Сумісність: {formatPercent(swap.compatibility.score)}</strong>
                                            <small>{(swap.compatibility.reasons || []).join(' • ')}</small>
                                        </div>
                                    )}
                                    {swap.partnerStats && (
                                        <div className="swap-partner-stats">
                                            <span>Influence: {swap.partnerStats.influenceScore}</span>
                                            <span>Успішність: {formatPercent(swap.partnerStats.successRate)}</span>
                                            <span>Завершено: {swap.partnerStats.completedExchanges}</span>
                                            <span>Рейтинг: {formatRating(swap.partnerStats.avgRating)} ({swap.partnerStats.reviewCount})</span>
                                        </div>
                                    )}
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
                                    {formatSlaHint(swap) && (
                                        <span className={`swap-sla-hint ${swap.isOverdue ? 'overdue' : ''}`}>
                                            {formatSlaHint(swap)}
                                        </span>
                                    )}
                                    {swap.deferredByMe && <span className="swap-deferred-tag">Відкладено</span>}
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
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => openMatchChatWithPrefill(swap.id, 'Привіт! Давайте уточнимо умови обміну: формат, дедлайн та очікуваний результат.')}
                                            >
                                                Уточнити умови
                                            </button>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => openMatchChatWithPrefill(swap.id, 'Пропоную інший формат обміну: можемо змінити тип або обсяг взаємодії.')}
                                            >
                                                Інший формат
                                            </button>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => handleDefer(swap.id)}
                                                disabled={processing === swap.id}
                                            >
                                                Відкласти
                                            </button>
                                            <button className="btn btn-danger btn-sm" onClick={() => openCancelModal(swap.id)} disabled={processing === swap.id}>
                                                Скасувати
                                            </button>
                                        </>
                                    )}
                                    {swap.status === 'accepted' && (
                                        <>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => openMatchChatWithPrefill(swap.id, 'Погоджуємо умови обміну. Підтвердіть, будь ласка, поточний статус виконання.')}
                                            >
                                                Уточнити умови
                                            </button>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => handleDefer(swap.id)}
                                                disabled={processing === swap.id}
                                            >
                                                Відкласти
                                            </button>
                                            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/support/chats?thread=match-${swap.id}`)}>
                                                Повідомлення
                                            </button>
                                            <button className="btn btn-primary btn-sm" onClick={() => openCompleteChecklist(swap.id)} disabled={processing === swap.id}>
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
                                                <button className="btn btn-primary btn-sm" onClick={() => openReviewModal(swap.id)}>
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

            {pagination.totalPages > 1 && (
                <div className="swaps-pagination card">
                    <button className="btn btn-secondary btn-sm" disabled={!pagination.hasPrev} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
                        Назад
                    </button>
                    <span className="swaps-pagination-info">
                        Сторінка {pagination.page} з {pagination.totalPages} • Усього: {pagination.total}
                    </span>
                    <button className="btn btn-secondary btn-sm" disabled={!pagination.hasNext} onClick={() => setPage((prev) => prev + 1)}>
                        Далі
                    </button>
                </div>
            )}

            {bulkConfirm.open && (
                <div className="auth-required-modal" role="dialog" aria-modal="true">
                    <div className="auth-required-card">
                        <h3>Підтвердити масову дію</h3>
                        <p>
                            {bulkConfirm.action === 'decline'
                                ? `Скасувати ${selectedCount} запит(ів)?`
                                : `Відкласти ${selectedCount} запит(ів)?`}
                        </p>
                        <div className="auth-required-actions">
                            <button type="button" onClick={() => setBulkConfirm({ open: false, action: '' })} disabled={bulkBusy}>
                                Скасувати
                            </button>
                            <button type="button" className="primary" onClick={executeBulkAction} disabled={bulkBusy}>
                                Підтвердити
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {declineState.swapId && (
                <div className="auth-required-modal" role="dialog" aria-modal="true">
                    <div className="auth-required-card">
                        <h3>Причина скасування</h3>
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
                                Підтвердити
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {completeState.swapId && (
                <div className="auth-required-modal" role="dialog" aria-modal="true">
                    <div className="auth-required-card">
                        <h3>Чек-лист завершення обміну</h3>
                        <p>Підтвердьте, що обидві сторони виконали умови, перед фінальним завершенням.</p>
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
                            <span>Підтвердження (скріни/посилання) підготовлені у чаті</span>
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
                            <span>Партнер погодив завершення обміну</span>
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
                        <p>Це допоможе іншим користувачам оцінювати надійність партнерів.</p>
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
























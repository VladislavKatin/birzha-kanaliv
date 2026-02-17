import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { buildFallbackAvatar, handleAvatarError, resolveChannelAvatar } from '../../services/avatar';
import '../swaps/SwapsPage.css';
import './ExchangesPage.css';

const PAGE_LIMIT = 12;

function getApiErrorMessage(error, fallbackMessage) {
    return error?.response?.data?.error || fallbackMessage;
}

function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
}

function formatPercent(value) {
    return `${Math.max(0, Number(value || 0))}%`;
}

function formatRating(value) {
    const num = Number(value || 0);
    return num > 0 ? num.toFixed(1) : '0.0';
}

function formatDate(dateValue) {
    if (!dateValue) return '—';
    return new Date(dateValue).toLocaleDateString('uk-UA');
}

function isCanceledRequest(error) {
    return error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED';
}

export default function ExchangesPage() {
    const [exchanges, setExchanges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviewForm, setReviewForm] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [filters, setFilters] = useState({
        reviewed: 'all',
        sort: 'newest',
        search: '',
    });
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
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkReviewState, setBulkReviewState] = useState({
        open: false,
        rating: 5,
        comment: '',
        submitting: false,
    });
    const abortRef = useRef(null);

    const selectableIds = useMemo(
        () => exchanges.filter((item) => !item.hasReviewed).map((item) => item.id),
        [exchanges],
    );
    const selectedCount = selectedIds.length;

    const loadExchanges = useCallback(async () => {
        setLoadError('');
        try {
            if (abortRef.current) {
                abortRef.current.abort();
            }
            const controller = new AbortController();
            abortRef.current = controller;

            const params = new URLSearchParams();
            params.set('reviewed', filters.reviewed);
            params.set('sort', filters.sort);
            if (filters.search.trim()) params.set('search', filters.search.trim());
            params.set('page', String(page));
            params.set('limit', String(PAGE_LIMIT));

            const response = await api.get(`/exchanges?${params.toString()}`, { signal: controller.signal });
            setExchanges(response.data.exchanges || []);
            if (response.data?.pagination) {
                setPagination(response.data.pagination);
                if (response.data.pagination.page !== page) {
                    setPage(response.data.pagination.page);
                }
            }
        } catch (error) {
            if (isCanceledRequest(error)) return;
            console.error('Failed to load exchanges:', error);
            const message = getApiErrorMessage(error, 'Не вдалося завантажити завершені обміни.');
            setLoadError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [filters.reviewed, filters.sort, filters.search, page]);

    useEffect(() => {
        loadExchanges();
    }, [loadExchanges]);

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

    function toggleSelected(exchangeId) {
        setSelectedIds((prev) =>
            prev.includes(exchangeId) ? prev.filter((id) => id !== exchangeId) : [...prev, exchangeId],
        );
    }

    function toggleSelectAll() {
        setSelectedIds((prev) => (prev.length === selectableIds.length ? [] : [...selectableIds]));
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
            toast.success('Відгук надіслано');
            setReviewForm(null);
            await loadExchanges();
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Не вдалося надіслати відгук'));
        }
    }

    async function submitBulkReview() {
        if (!selectedIds.length) {
            toast.error('Оберіть хоча б один обмін без відгуку');
            return;
        }
        setBulkReviewState((prev) => ({ ...prev, submitting: true }));
        try {
            const response = await api.post('/exchanges/bulk-review', {
                matchIds: selectedIds,
                rating: bulkReviewState.rating,
                comment: bulkReviewState.comment.trim(),
            });

            const processed = Array.isArray(response.data?.processed) ? response.data.processed.length : 0;
            const skipped = Array.isArray(response.data?.skipped) ? response.data.skipped.length : 0;

            toast.success(`Масовий відгук: ${processed} оброблено, ${skipped} пропущено`);
            setSelectedIds([]);
            setBulkReviewState({ open: false, rating: 5, comment: '', submitting: false });
            await loadExchanges();
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Не вдалося надіслати масовий відгук'));
            setBulkReviewState((prev) => ({ ...prev, submitting: false }));
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

    if (loadError && exchanges.length === 0) {
        return (
            <div className="exchanges-page">
                <div className="swaps-empty card">
                    <span className="swaps-empty-icon">!</span>
                    <h3>Помилка завантаження</h3>
                    <p>{loadError}</p>
                    <button className="btn btn-secondary btn-sm" onClick={loadExchanges}>
                        Спробувати ще раз
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="exchanges-page">
            <div className="exchanges-header">
                <h1>Завершені обміни</h1>
                <p className="exchanges-subtitle">Історія ваших успішних обмінів трафіком</p>
            </div>

            <div className="swaps-controls card">
                <select
                    className="filter-select"
                    value={filters.reviewed}
                    onChange={(event) => {
                        setPage(1);
                        setFilters((prev) => ({ ...prev, reviewed: event.target.value }));
                    }}
                >
                    <option value="all">Усі обміни</option>
                    <option value="unreviewed">Без відгуку</option>
                    <option value="reviewed">З відгуком</option>
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
                    <option value="oldest">Найстаріші</option>
                    <option value="largest">Найбільші канали</option>
                    <option value="unreviewed_first">Спочатку без відгуку</option>
                </select>
                <input
                    className="filter-input"
                    type="text"
                    placeholder="Пошук за каналом або описом"
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
                        <span>Обрати всі без відгуку</span>
                    </label>
                    <span className="swaps-bulk-count">Обрано: {selectedCount}</span>
                    <button
                        className="btn btn-primary btn-sm"
                        disabled={!selectedCount}
                        onClick={() => setBulkReviewState((prev) => ({ ...prev, open: true }))}
                    >
                        Масовий відгук
                    </button>
                </div>
            )}

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
                                {!exchange.hasReviewed && (
                                    <label className="swap-selectbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(exchange.id)}
                                            onChange={() => toggleSelected(exchange.id)}
                                        />
                                    </label>
                                )}
                                <img
                                    src={resolveChannelAvatar(exchange.partner?.channelAvatar, exchange.partner?.channelTitle)}
                                    data-fallback-src={buildFallbackAvatar(exchange.partner?.channelTitle)}
                                    onError={handleAvatarError}
                                    alt={exchange.partner?.channelTitle || 'Канал'}
                                    className="exchange-partner-avatar"
                                />
                                <div className="exchange-partner-info">
                                    <span className="exchange-partner-name">{exchange.partner?.channelTitle || 'Канал'}</span>
                                    <span className="exchange-partner-subs">{formatNumber(exchange.partner?.subscribers)} підписників</span>
                                    {exchange.partnerStats && (
                                        <div className="swap-partner-stats">
                                            <span>Influence: {exchange.partnerStats.influenceScore}</span>
                                            <span>Успішність: {formatPercent(exchange.partnerStats.successRate)}</span>
                                            <span>Рейтинг: {formatRating(exchange.partnerStats.avgRating)} ({exchange.partnerStats.reviewCount})</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="exchange-meta">
                                {exchange.offer && (
                                    <span className="exchange-type">
                                        {exchange.offer.type === 'subs' ? 'Підписники' : 'Перегляди'}
                                    </span>
                                )}
                                {exchange.offer?.description && (
                                    <span className="exchange-desc">{exchange.offer.description}</span>
                                )}
                                <span className="exchange-date">{formatDate(exchange.completedAt)}</span>
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

            {bulkReviewState.open && (
                <div className="modal-overlay" onClick={() => setBulkReviewState((prev) => ({ ...prev, open: false }))}>
                    <div className="modal-content review-modal" onClick={(event) => event.stopPropagation()}>
                        <h3>Масовий відгук для {selectedCount} обмінів</h3>
                        <div className="review-rating">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    className={`star-btn ${star <= bulkReviewState.rating ? 'active' : ''}`}
                                    onClick={() => setBulkReviewState((prev) => ({ ...prev, rating: star }))}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                        <textarea
                            className="review-textarea"
                            placeholder="Коментар для масового відгуку (необов'язково)"
                            value={bulkReviewState.comment}
                            onChange={(event) => setBulkReviewState((prev) => ({ ...prev, comment: event.target.value }))}
                            rows={4}
                        />
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setBulkReviewState((prev) => ({ ...prev, open: false }))} disabled={bulkReviewState.submitting}>
                                Скасувати
                            </button>
                            <button className="btn btn-primary" onClick={submitBulkReview} disabled={bulkReviewState.submitting}>
                                Підтвердити
                            </button>
                        </div>
                    </div>
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

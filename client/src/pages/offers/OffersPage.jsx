import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import api from '../../services/api';
import { buildOfferDetailsPath, getNicheOptions, isDemoChannel, splitOffersByChannelKind } from '../../services/publicOffers';
import './OffersPage.css';

function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
}

export default function OffersPage() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ niche: '' });
    const [isCreating, setIsCreating] = useState(false);
    const [respondingOfferId, setRespondingOfferId] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({
        type: 'subs',
        description: '',
        niche: '',
        minSubscribers: 0,
        maxSubscribers: 0,
    });
    const [myChannels, setMyChannels] = useState([]);
    const [selectedChannelId, setSelectedChannelId] = useState('');
    const nicheOptions = getNicheOptions();

    const loadOffers = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filter.niche) {
                params.set('niche', filter.niche);
            }
            params.set('limit', '200');
            const response = await api.get(`/offers?${params.toString()}`);
            setOffers(response.data.offers || response.data || []);
        } catch (error) {
            console.error('Failed to load offers:', error);
        } finally {
            setLoading(false);
        }
    }, [filter.niche]);

    const loadMyChannels = useCallback(async () => {
        try {
            const response = await api.get('/channels/my');
            const channels = response.data.channels || [];
            setMyChannels(channels);
            if (channels.length > 0) {
                setSelectedChannelId(channels[0].id);
            }
        } catch (error) {
            console.error('Failed to load channels:', error);
        }
    }, []);

    useEffect(() => {
        loadOffers();
    }, [loadOffers]);

    useEffect(() => {
        if (user) {
            loadMyChannels();
        }
    }, [user, loadMyChannels]);

    async function handleCreateOffer() {
        if (!selectedChannelId) {
            toast.error('Спочатку підключіть канал.');
            return;
        }

        if (isCreating) {
            return;
        }

        setIsCreating(true);
        try {
            await api.post('/offers', {
                channelId: selectedChannelId,
                ...createForm,
            });
            toast.success('Пропозицію створено.');
            setShowCreate(false);
            setCreateForm({
                type: 'subs',
                description: '',
                niche: '',
                minSubscribers: 0,
                maxSubscribers: 0,
            });
            loadOffers();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Не вдалося створити пропозицію.');
        } finally {
            setIsCreating(false);
        }
    }

    async function handleRespond(offerId) {
        if (!selectedChannelId) {
            toast.error('Спочатку підключіть канал.');
            return;
        }

        if (respondingOfferId) {
            return;
        }

        setRespondingOfferId(offerId);
        try {
            await api.post(`/offers/${offerId}/respond`, { channelId: selectedChannelId });
            toast.success('Відгук надіслано.');
            loadOffers();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Не вдалося надіслати відгук.');
        } finally {
            setRespondingOfferId('');
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

    const { realOffers, demoOffers } = splitOffersByChannelKind(offers);
    const visibleOffers = [...realOffers, ...demoOffers];

    return (
        <div className="offers-page">
            <div className="offers-header">
                <div>
                    <h1>Каталог пропозицій</h1>
                    <p className="offers-subtitle">Знайдіть партнера для обміну аудиторією</p>
                </div>
                {user && (
                    <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                        Створити пропозицію
                    </button>
                )}
            </div>

            <div className="offers-filters card">
                <select
                    className="filter-select"
                    value={filter.niche}
                    onChange={(event) => {
                        setFilter((prev) => ({ ...prev, niche: event.target.value }));
                    }}
                >
                    <option value="">Ніша каналу</option>
                    {nicheOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            {visibleOffers.length === 0 ? (
                <div className="swaps-empty card">
                    <span className="swaps-empty-icon">!</span>
                    <h3>Пропозицій поки немає</h3>
                    <p>Спробуйте змінити фільтр.</p>
                </div>
            ) : (
                <div className="offers-grid">
                    {visibleOffers.map((offer) => (
                        <div key={offer.id} className="offer-card card">
                            <div className="offer-card-top">
                                <img src={offer.channel?.channelAvatar || ''} alt="" className="offer-card-avatar" />
                                <div className="offer-card-channel">
                                    <span className="offer-card-name">
                                        {offer.channel?.channelTitle || 'Канал'}
                                        {isDemoChannel(offer.channel) && (
                                            <span className="offer-demo-badge" title="Демо-канал" aria-label="Демо-канал">
                                                DEMO
                                            </span>
                                        )}
                                    </span>
                                    <span className="offer-card-subs">{formatNumber(offer.channel?.subscribers)} підписників</span>
                                </div>
                                <span className={`offer-type-badge ${offer.type}`}>{offer.type === 'subs' ? 'Підписники' : 'Перегляди'}</span>
                            </div>

                            {offer.description && <p className="offer-card-desc">{offer.description}</p>}

                            <div className="offer-card-tags">
                                {offer.niche && <span className="meta-tag">{offer.niche}</span>}
                                {offer.language && <span className="meta-tag">{offer.language}</span>}
                                {offer.minSubscribers > 0 && <span className="meta-tag">від {formatNumber(offer.minSubscribers)} підпис.</span>}
                                {offer.channel?.totalViews > 0 && <span className="meta-tag">{formatNumber(offer.channel.totalViews)} переглядів</span>}
                            </div>

                            <div className="offer-card-actions">
                                <button className="btn btn-secondary btn-sm" onClick={() => navigate(buildOfferDetailsPath(offer.id))}>
                                    Деталі
                                </button>
                                {user ? (
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => handleRespond(offer.id)}
                                        disabled={respondingOfferId === offer.id}
                                    >
                                        {respondingOfferId === offer.id ? 'Надсилаємо...' : 'Відгукнутися'}
                                    </button>
                                ) : (
                                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/auth')}>
                                        Увійти для відгуку
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal-content create-offer-modal" onClick={(event) => event.stopPropagation()}>
                        <h3>Створити пропозицію обміну</h3>

                        <div className="form-group">
                            <label className="form-label">Канал</label>
                            <select className="filter-select full-width" value={selectedChannelId} onChange={(event) => setSelectedChannelId(event.target.value)}>
                                {myChannels.map((channel) => (
                                    <option key={channel.id} value={channel.id}>
                                        {channel.channelTitle}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Тип обміну</label>
                            <select className="filter-select full-width" value={createForm.type} onChange={(event) => setCreateForm((prev) => ({ ...prev, type: event.target.value }))}>
                                <option value="subs">Підписники</option>
                                <option value="views">Перегляди</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Опис</label>
                            <textarea
                                className="review-textarea"
                                placeholder="Опишіть, що ви пропонуєте..."
                                value={createForm.description}
                                onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
                                rows={3}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Ніша (необов'язково)</label>
                            <input
                                type="text"
                                className="filter-input full-width"
                                placeholder="Наприклад: Gaming, Tech, Music..."
                                value={createForm.niche}
                                onChange={(event) => setCreateForm((prev) => ({ ...prev, niche: event.target.value }))}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Мін. підписників</label>
                                <input
                                    type="number"
                                    className="filter-input full-width"
                                    value={createForm.minSubscribers}
                                    onChange={(event) => setCreateForm((prev) => ({ ...prev, minSubscribers: parseInt(event.target.value, 10) || 0 }))}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Макс. підписників</label>
                                <input
                                    type="number"
                                    className="filter-input full-width"
                                    value={createForm.maxSubscribers}
                                    onChange={(event) => setCreateForm((prev) => ({ ...prev, maxSubscribers: parseInt(event.target.value, 10) || 0 }))}
                                />
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                                Скасувати
                            </button>
                            <button className="btn btn-primary" onClick={handleCreateOffer} disabled={isCreating}>
                                {isCreating ? 'Створюємо...' : 'Створити'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

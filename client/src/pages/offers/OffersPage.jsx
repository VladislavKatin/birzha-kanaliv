import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import api from '../../services/api';
import {
    buildOfferDetailsPath,
    getLanguageOptions,
    getLanguageSearchValue,
    getNicheOptions,
    isDemoChannel,
    normalizeOfferDescription,
    resolveLanguageCode,
    splitOffersByChannelKind,
} from '../../services/publicOffers';
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
    const [filter, setFilter] = useState({ niche: '', language: '' });
    const [respondingOfferId, setRespondingOfferId] = useState('');
    const [myChannels, setMyChannels] = useState([]);
    const [selectedChannelId, setSelectedChannelId] = useState('');

    const nicheOptions = getNicheOptions();
    const languageOptions = getLanguageOptions();

    const loadOffers = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filter.niche) {
                params.set('niche', filter.niche);
            }

            const languageCode = resolveLanguageCode(filter.language);
            if (languageCode) {
                params.set('language', languageCode);
            }

            params.set('includeAll', 'true');
            params.set('limit', '200');
            const response = await api.get(`/offers?${params.toString()}`);
            setOffers(response.data.offers || response.data || []);
        } catch (error) {
            console.error('Failed to load offers:', error);
        } finally {
            setLoading(false);
        }
    }, [filter.niche, filter.language]);

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
                    <p className="offers-subtitle">Активні канали відображаються автоматично. Реальні канали показані першими.</p>
                </div>
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
                <input
                    type="text"
                    className="filter-input"
                    list="dashboard-offers-language-options"
                    placeholder="Мова каналу"
                    value={filter.language}
                    onChange={(event) => {
                        setFilter((prev) => ({ ...prev, language: event.target.value }));
                    }}
                />
                <datalist id="dashboard-offers-language-options">
                    {languageOptions.map((option) => (
                        <option key={option.code} value={getLanguageSearchValue(option)} />
                    ))}
                </datalist>
                {user && myChannels.length > 1 && (
                    <select
                        className="filter-select"
                        value={selectedChannelId}
                        onChange={(event) => setSelectedChannelId(event.target.value)}
                    >
                        {myChannels.map((channel) => (
                            <option key={channel.id} value={channel.id}>
                                Мій канал: {channel.channelTitle}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {visibleOffers.length === 0 ? (
                <div className="swaps-empty card">
                    <span className="swaps-empty-icon">!</span>
                    <h3>Пропозицій поки немає</h3>
                    <p>Активуйте канал у розділі «Мої канали», щоб він з'явився тут.</p>
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

                            {offer.description && (
                                <p className="offer-card-desc">{normalizeOfferDescription(offer.description, offer.channel?.channelTitle)}</p>
                            )}

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
                                        disabled={respondingOfferId === offer.id || offer.status !== 'open'}
                                    >
                                        {respondingOfferId === offer.id ? 'Надсилаємо...' : offer.status === 'open' ? 'Відгукнутися' : 'Недоступно'}
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
        </div>
    );
}

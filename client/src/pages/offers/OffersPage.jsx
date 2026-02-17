import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import api from '../../services/api';
import { buildAuthRedirectPath } from '../../services/navigation';
import OfferPreviewModal from '../../components/offers/OfferPreviewModal';
import {
    buildOfferDetailsPath,
    getLanguageLabel,
    getLanguageOptions,
    getLanguageSearchValue,
    getNicheLabel,
    getNicheOptions,
    normalizeOfferDescription,
    prepareOffersForCatalog,
    resolveLanguageCode,
} from '../../services/publicOffers';
import { buildFallbackAvatar, handleAvatarError, resolveChannelAvatar } from '../../services/avatar';
import './OffersPage.css';

function getApiErrorMessage(error, fallbackMessage) {
    return error?.response?.data?.error || fallbackMessage;
}

function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
}

export default function OffersPage() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState({ niche: '', language: '' });
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [responseOffer, setResponseOffer] = useState(null);
    const [myChannels, setMyChannels] = useState([]);
    const [selectedResponseChannelId, setSelectedResponseChannelId] = useState('');
    const [responding, setResponding] = useState(false);

    const nicheOptions = getNicheOptions();
    const languageOptions = getLanguageOptions();

    const loadOffers = useCallback(async () => {
        setLoading(true);
        setError('');
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
            params.set('limit', '60');
            const response = await api.get(`/offers?${params.toString()}`);
            setOffers(response.data.offers || response.data || []);
        } catch (loadError) {
            console.error('Failed to load offers:', loadError);
            const message = getApiErrorMessage(loadError, 'Не вдалося завантажити пропозиції. Спробуйте ще раз.');
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [filter.niche, filter.language]);

    useEffect(() => {
        loadOffers();
    }, [loadOffers]);

    useEffect(() => {
        if (!user) {
            return;
        }

        let cancelled = false;

        async function loadMyChannels() {
            try {
                const response = await api.get('/channels/my');
                if (cancelled) {
                    return;
                }
                const channels = response.data.channels || [];
                setMyChannels(channels);
                setSelectedResponseChannelId((current) => current || channels[0]?.id || '');
            } catch {
                if (!cancelled) {
                    setMyChannels([]);
                    setSelectedResponseChannelId('');
                    toast.error('Не вдалося завантажити ваші канали.');
                }
            }
        }

        loadMyChannels();

        return () => {
            cancelled = true;
        };
    }, [user]);

    useEffect(() => {
        if (!offers.length) return;
        const params = new URLSearchParams(location.search);
        const targetOfferId = params.get('targetOfferId');
        if (!targetOfferId) return;

        const targetOffer = offers.find((offer) => offer.id === targetOfferId);
        if (targetOffer) {
            setSelectedOffer(targetOffer);
        }
    }, [offers, location.search]);

    const openResponseModal = useCallback((offer) => {
        if (!user) {
            navigate(buildAuthRedirectPath(buildOfferDetailsPath(offer.id)));
            return;
        }

        if (!myChannels.length) {
            toast.error('Підключіть канал у розділі «Мої канали», щоб запропонувати обмін.');
            navigate('/my-channels');
            return;
        }

        setSelectedResponseChannelId((current) => current || myChannels[0].id);
        setResponseOffer(offer);
    }, [myChannels, navigate, user]);

    async function submitResponse() {
        if (!responseOffer?.id) {
            return;
        }

        if (!selectedResponseChannelId) {
            toast.error('Оберіть канал для обміну.');
            return;
        }

        setResponding(true);
        try {
            await api.post(`/offers/${responseOffer.id}/respond`, { channelId: selectedResponseChannelId });
            toast.success('Запит на обмін надіслано.');
            setResponseOffer(null);
        } catch (requestError) {
            toast.error(getApiErrorMessage(requestError, 'Не вдалося надіслати запит на обмін.'));
        } finally {
            setResponding(false);
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

    const visibleOffers = prepareOffersForCatalog(offers);

    return (
        <div className="offers-page">
            <div className="offers-header">
                <div>
                    <h1>Каталог пропозицій</h1>
                    <p className="offers-subtitle">Переглядайте доступні канали та надсилайте пропозиції для обміну.</p>
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
            </div>

            {error ? (
                <div className="swaps-empty card">
                    <span className="swaps-empty-icon">!</span>
                    <h3>Помилка завантаження</h3>
                    <p>{error}</p>
                    <button className="btn btn-secondary btn-sm" onClick={() => loadOffers()}>
                        Спробувати ще раз
                    </button>
                </div>
            ) : visibleOffers.length === 0 ? (
                <div className="swaps-empty card">
                    <span className="swaps-empty-icon">!</span>
                    <h3>Пропозицій поки немає</h3>
                    <p>Активуйте канал у розділі «Мої канали», щоб він з&apos;явився тут.</p>
                    <ul className="offers-empty-list">
                        <li>Підключіть і активуйте хоча б один YouTube-канал</li>
                        <li>Додайте базову інформацію у профіль</li>
                        <li>Увімкніть сповіщення, щоб не пропустити відповіді</li>
                    </ul>
                    <div className="offers-empty-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => navigate('/my-channels')}>
                            До моїх каналів
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/profile/edit')}>
                            Заповнити профіль
                        </button>
                    </div>
                </div>
            ) : (
                <div className="offers-grid">
                    {visibleOffers.map((offer) => (
                        <div key={offer.id} className="offer-card card">
                            <div className="offer-card-top">
                                <img
                                    src={resolveChannelAvatar(offer.channel?.channelAvatar, offer.channel?.channelTitle)}
                                    data-fallback-src={buildFallbackAvatar(offer.channel?.channelTitle)}
                                    onError={handleAvatarError}
                                    alt={offer.channel?.channelTitle || 'Канал'}
                                    className="offer-card-avatar"
                                />
                                <div className="offer-card-channel">
                                    <span className="offer-card-name">
                                        {offer.channel?.channelTitle || 'Канал'}
                                        {offer.__isDemo && <span className="offer-demo-badge">DEMO</span>}
                                    </span>
                                    <span className="offer-card-subs">{formatNumber(offer.channel?.subscribers)} підписників</span>
                                </div>
                                <span className={`offer-type-badge ${offer.type}`}>{offer.type === 'subs' ? 'Підписники' : 'Перегляди'}</span>
                            </div>

                            {offer.description && (
                                <p className="offer-card-desc">{normalizeOfferDescription(offer.description, offer.channel?.channelTitle)}</p>
                            )}

                            <div className="offer-card-tags">
                                {offer.niche && <span className="meta-tag">{getNicheLabel(offer.niche)}</span>}
                                {offer.language && <span className="meta-tag">{getLanguageLabel(offer.language)}</span>}
                                {offer.minSubscribers > 0 && <span className="meta-tag">від {formatNumber(offer.minSubscribers)} підпис.</span>}
                                {offer.channel?.totalViews > 0 && <span className="meta-tag">{formatNumber(offer.channel.totalViews)} переглядів</span>}
                            </div>

                            <div className="offer-card-actions">
                                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedOffer(offer)}>
                                    Переглянути
                                </button>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => openResponseModal(offer)}
                                >
                                    Запропонувати обмін
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedOffer && (
                <OfferPreviewModal
                    offer={selectedOffer}
                    onClose={() => setSelectedOffer(null)}
                    onPropose={(offer) => {
                        setSelectedOffer(null);
                        openResponseModal(offer);
                    }}
                />
            )}
            {responseOffer && (
                <div className="offer-response-overlay" role="dialog" aria-modal="true">
                    <div className="offer-response-modal card">
                        <h3>Запропонувати обмін</h3>
                        <p>
                            Канал: <strong>{responseOffer.channel?.channelTitle || 'Канал'}</strong>
                        </p>
                        <label htmlFor="responseChannelSelect" className="form-label">Ваш канал</label>
                        <select
                            id="responseChannelSelect"
                            className="filter-select full-width"
                            value={selectedResponseChannelId}
                            onChange={(event) => setSelectedResponseChannelId(event.target.value)}
                        >
                            {myChannels.map((channel) => (
                                <option key={channel.id} value={channel.id}>
                                    {channel.channelTitle}
                                </option>
                            ))}
                        </select>
                        <div className="offer-response-actions">
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setResponseOffer(null)} disabled={responding}>
                                Скасувати
                            </button>
                            <button type="button" className="btn btn-primary btn-sm" onClick={submitResponse} disabled={responding}>
                                {responding ? 'Надсилаємо...' : 'Надіслати запит'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


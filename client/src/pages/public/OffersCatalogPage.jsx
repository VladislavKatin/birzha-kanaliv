import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicLayout from '../../components/layout/PublicLayout';
import OfferPreviewModal from '../../components/offers/OfferPreviewModal';
import useAuthStore from '../../stores/authStore';
import api from '../../services/api';
import { buildFallbackAvatar, handleAvatarError, resolveChannelAvatar } from '../../services/avatar';
import { buildAuthRedirectPath } from '../../services/navigation';
import {
    buildOfferDetailsPath,
    buildPublicOffersQuery,
    formatPublicNumber,
    getLanguageLabel,
    getLanguageOptions,
    getLanguageSearchValue,
    getNicheLabel,
    getNicheOptions,
    getOfferTypeLabel,
    normalizeOfferDescription,
} from '../../services/publicOffers';
import './OffersCatalogPage.css';

export default function OffersCatalogPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState({ niche: '', language: '' });
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [authPromptOfferId, setAuthPromptOfferId] = useState('');

    const nicheOptions = useMemo(() => getNicheOptions(), []);
    const languageOptions = useMemo(() => getLanguageOptions(), []);
    const query = useMemo(() => buildPublicOffersQuery(filter), [filter]);
    const visibleOffers = useMemo(() => {
        const byCreatedAtDesc = (a, b) => {
            const timeA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
        };
        return [...offers].sort(byCreatedAtDesc);
    }, [offers]);

    useEffect(() => {
        try {
            const raw = window.localStorage.getItem('public_offers_filter');
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (typeof parsed === 'object' && parsed) {
                setFilter({
                    niche: typeof parsed.niche === 'string' ? parsed.niche : '',
                    language: typeof parsed.language === 'string' ? parsed.language : '',
                });
            }
        } catch {
            // ignore invalid local cache
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function loadOffers() {
            setLoading(true);
            setError('');
            try {
                const suffix = query ? `${query}&includeAll=true&limit=60` : '?includeAll=true&limit=60';
                const response = await api.get(`/offers${suffix}`);
                if (cancelled) {
                    return;
                }
                setOffers(response.data.offers || []);
            } catch {
                if (!cancelled) {
                    setError('Не вдалося завантажити каталог пропозицій.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadOffers();

        return () => {
            cancelled = true;
        };
    }, [query]);

    return (
        <PublicLayout>
            <section className="offers-catalog-page">
                <div className="offers-catalog-inner">
                    <header className="offers-catalog-header">
                        <h1>Каталог пропозицій обміну</h1>
                        <p>Переглядайте канали та пропонуйте обмін. Для відправки пропозиції потрібна авторизація.</p>
                    </header>

                    <div className="offers-catalog-filters">
                        <select
                            value={filter.niche}
                            onChange={(event) => {
                                const next = { ...filter, niche: event.target.value };
                                setFilter(next);
                                window.localStorage.setItem('public_offers_filter', JSON.stringify(next));
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
                            list="offers-language-options"
                            placeholder="Мова каналу"
                            value={filter.language}
                            onChange={(event) => {
                                const next = { ...filter, language: event.target.value };
                                setFilter(next);
                                window.localStorage.setItem('public_offers_filter', JSON.stringify(next));
                            }}
                        />
                        <datalist id="offers-language-options">
                            {languageOptions.map((option) => (
                                <option key={option.code} value={getLanguageSearchValue(option)} />
                            ))}
                        </datalist>
                    </div>

                    {loading ? (
                        <div className="offers-catalog-empty">Завантаження каталогу...</div>
                    ) : error ? (
                        <div className="offers-catalog-empty">{error}</div>
                    ) : visibleOffers.length === 0 ? (
                        <div className="offers-catalog-empty">Поки немає відкритих пропозицій.</div>
                    ) : (
                        <div className="offers-catalog-grid">
                            {visibleOffers.map((offer) => (
                                <article key={offer.id} className="public-offer-card">
                                    <div className="public-offer-head">
                                        <img src={resolveChannelAvatar(offer.channel?.channelAvatar, offer.channel?.channelTitle)} data-fallback-src={buildFallbackAvatar(offer.channel?.channelTitle)} onError={handleAvatarError} alt={offer.channel?.channelTitle || 'Канал'} />
                                        <div>
                                            <h3>{offer.channel?.channelTitle || 'Канал'}</h3>
                                            <p>{formatPublicNumber(offer.channel?.subscribers)} підписників</p>
                                        </div>
                                        <span>{getOfferTypeLabel(offer.type)}</span>
                                    </div>

                                    {offer.description && (
                                        <p className="public-offer-desc">
                                            {normalizeOfferDescription(offer.description, offer.channel?.channelTitle)}
                                        </p>
                                    )}

                                    <div className="public-offer-meta">
                                        {offer.niche && <span>{getNicheLabel(offer.niche)}</span>}
                                        {offer.language && <span>{getLanguageLabel(offer.language)}</span>}
                                        {offer.minSubscribers > 0 && <span>від {formatPublicNumber(offer.minSubscribers)}</span>}
                                        {offer.channel?.totalViews > 0 && <span>{formatPublicNumber(offer.channel.totalViews)} переглядів</span>}
                                    </div>

                                    <div className="public-offer-actions">
                                        <button onClick={() => setSelectedOffer(offer)}>Просмотреть</button>
                                        <button
                                            className="primary"
                                            onClick={() => {
                                                if (user) {
                                                    navigate(buildOfferDetailsPath(offer.id));
                                                    return;
                                                }
                                                setAuthPromptOfferId(offer.id);
                                            }}
                                        >
                                            Предложить обмен
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {selectedOffer && (
                <OfferPreviewModal
                    offer={selectedOffer}
                    onClose={() => setSelectedOffer(null)}
                    onPropose={(offer) => {
                        setSelectedOffer(null);
                        if (user) {
                            navigate(buildOfferDetailsPath(offer.id));
                            return;
                        }
                        setAuthPromptOfferId(offer.id);
                    }}
                />
            )}
            {authPromptOfferId && (
                <div className="auth-required-modal" role="dialog" aria-modal="true">
                    <div className="auth-required-card">
                        <h3>Потрібна реєстрація</h3>
                        <p>Щоб запропонувати обмін, спочатку потрібно зареєструватися або увійти.</p>
                        <div className="auth-required-actions">
                            <button type="button" onClick={() => setAuthPromptOfferId('')}>
                                Скасувати
                            </button>
                            <button
                                type="button"
                                className="primary"
                                onClick={() => navigate(buildAuthRedirectPath(`/dashboard/offers?targetOfferId=${authPromptOfferId}`))}
                            >
                                Зареєструватися / Увійти
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PublicLayout>
    );
}

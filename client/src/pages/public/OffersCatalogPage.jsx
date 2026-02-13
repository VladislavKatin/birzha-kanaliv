import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicLayout from '../../components/layout/PublicLayout';
import useAuthStore from '../../stores/authStore';
import api from '../../services/api';
import { buildAuthRedirectPath } from '../../services/navigation';
import {
    buildOfferDetailsPath,
    buildPublicOffersQuery,
    formatPublicNumber,
    getLanguageOptions,
    getLanguageSearchValue,
    getNicheOptions,
    getOfferTypeLabel,
    isDemoChannel,
    splitOffersByChannelKind,
} from '../../services/publicOffers';
import './OffersCatalogPage.css';

export default function OffersCatalogPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState({ niche: '', language: '' });
    const [showDemoOffers, setShowDemoOffers] = useState(false);
    const [realChannels, setRealChannels] = useState([]);

    const nicheOptions = useMemo(() => getNicheOptions(), []);
    const languageOptions = useMemo(() => getLanguageOptions(), []);
    const query = useMemo(() => buildPublicOffersQuery(filter), [filter]);
    const { realOffers, demoOffers } = useMemo(() => splitOffersByChannelKind(offers), [offers]);
    const visibleOffers = showDemoOffers ? [...realOffers, ...demoOffers] : realOffers;

    useEffect(() => {
        let cancelled = false;

        async function loadOffers() {
            setLoading(true);
            setError('');
            try {
                const response = await api.get(`/offers${query}`);
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

    useEffect(() => {
        let cancelled = false;

        async function loadRealChannels() {
            try {
                const response = await api.get('/channels?limit=200');
                if (cancelled) {
                    return;
                }

                const channels = response.data.channels || [];
                const sortedRealChannels = channels
                    .filter((channel) => !isDemoChannel(channel))
                    .sort((a, b) => new Date(b.connectedAt || 0).getTime() - new Date(a.connectedAt || 0).getTime());
                setRealChannels(sortedRealChannels);
            } catch {
                if (!cancelled) {
                    setRealChannels([]);
                }
            }
        }

        loadRealChannels();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <PublicLayout>
            <section className="offers-catalog-page">
                <div className="offers-catalog-inner">
                    <header className="offers-catalog-header">
                        <h1>Каталог пропозицій обміну</h1>
                        <p>Переглядайте відкриті пропозиції від каналів. Відповідати на них можуть лише авторизовані користувачі.</p>
                    </header>

                    <div className="offers-catalog-filters">
                        <select
                            value={filter.niche}
                            onChange={(event) => setFilter((prev) => ({ ...prev, niche: event.target.value }))}
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
                            onChange={(event) => setFilter((prev) => ({ ...prev, language: event.target.value }))}
                        />
                        <datalist id="offers-language-options">
                            {languageOptions.map((option) => (
                                <option key={option.code} value={getLanguageSearchValue(option)} />
                            ))}
                        </datalist>
                        {demoOffers.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setShowDemoOffers((value) => !value)}
                            >
                                {showDemoOffers ? 'Сховати DEMO' : `Показати DEMO (${demoOffers.length})`}
                            </button>
                        )}
                    </div>

                    <div className="public-real-channels">
                        <div className="public-real-channels-head">
                            <h3>Реально зареєстровані канали</h3>
                            <span>{realChannels.length}</span>
                        </div>
                        {realChannels.length === 0 ? (
                            <p className="public-real-channels-empty">Поки немає каналів реальних користувачів.</p>
                        ) : (
                            <div className="public-real-channels-list">
                                {realChannels.slice(0, 12).map((channel) => (
                                    <article key={channel.id} className="public-real-channel-item">
                                        <img src={channel.channelAvatar || ''} alt="" />
                                        <div>
                                            <strong>{channel.channelTitle || 'Канал'}</strong>
                                            <span>{formatPublicNumber(channel.subscribers)} підписників</span>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
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
                                        <img src={offer.channel?.channelAvatar || ''} alt="" />
                                        <div>
                                            <h3>
                                                {offer.channel?.channelTitle || 'Канал'}
                                                {isDemoChannel(offer.channel) && (
                                                    <span className="demo-badge" title="Демо-канал" aria-label="Демо-канал">
                                                        ◉
                                                    </span>
                                                )}
                                            </h3>
                                            <p>{formatPublicNumber(offer.channel?.subscribers)} підписників</p>
                                        </div>
                                        <span>{getOfferTypeLabel(offer.type)}</span>
                                    </div>

                                    {offer.description && <p className="public-offer-desc">{offer.description}</p>}

                                    <div className="public-offer-meta">
                                        {offer.niche && <span>{offer.niche}</span>}
                                        {offer.language && <span>{offer.language}</span>}
                                        {offer.minSubscribers > 0 && <span>від {formatPublicNumber(offer.minSubscribers)}</span>}
                                    </div>

                                    <div className="public-offer-actions">
                                        <button onClick={() => navigate(buildOfferDetailsPath(offer.id))}>Відкрити пропозицію</button>
                                        {user ? (
                                            <button className="primary" onClick={() => navigate(`/offers/${offer.id}`)}>
                                                Запропонувати обмін
                                            </button>
                                        ) : (
                                            <button className="primary" onClick={() => navigate(buildAuthRedirectPath(buildOfferDetailsPath(offer.id)))}>
                                                Увійти, щоб відповісти
                                            </button>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </PublicLayout>
    );
}

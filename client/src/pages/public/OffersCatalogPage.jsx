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
} from '../../services/publicOffers';
import './OffersCatalogPage.css';

export default function OffersCatalogPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState({ niche: '', language: '' });

    const nicheOptions = useMemo(() => getNicheOptions(), []);
    const languageOptions = useMemo(() => getLanguageOptions(), []);
    const query = useMemo(() => buildPublicOffersQuery(filter), [filter]);
    const visibleOffers = useMemo(() => {
        const realOffers = offers.filter((offer) => !isDemoChannel(offer.channel));
        const demoOffers = offers.filter((offer) => isDemoChannel(offer.channel));
        const byCreatedAtDesc = (a, b) => {
            const timeA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
        };
        return [...realOffers.sort(byCreatedAtDesc), ...demoOffers.sort(byCreatedAtDesc)];
    }, [offers]);

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
                                                        DEMO
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
                                        {offer.channel?.totalViews > 0 && <span>{formatPublicNumber(offer.channel.totalViews)} переглядів</span>}
                                    </div>

                                    <div className="public-offer-actions">
                                        <button onClick={() => navigate(buildOfferDetailsPath(offer.id))}>Деталі</button>
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

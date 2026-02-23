import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import PublicLayout from '../../components/layout/PublicLayout';
import useAuthStore from '../../stores/authStore';
import api from '../../services/api';
import { buildFallbackAvatar, handleAvatarError, resolveChannelAvatar } from '../../services/avatar';
import { buildAuthRedirectPath } from '../../services/navigation';
import {
    formatPublicNumber,
    getOfferTypeLabel,
    isDemoChannel,
    normalizeDisplayText,
    normalizeOfferDescription,
} from '../../services/publicOffers';
import { applyPageSeo } from '../../services/seo';
import './OfferDetailsPage.css';

function isOfferAvailableForResponse(offer) {
    return !!offer;
}

function getOfferStatusLabel(status) {
    const map = {
        open: 'Активна',
        matched: 'Активна',
        completed: 'Активна',
    };
    return map[status] || 'Активна';
}

export default function OfferDetailsPage() {
    const navigate = useNavigate();
    const { offerId } = useParams();
    const { user } = useAuthStore();

    const [offer, setOffer] = useState(null);
    const [offerError, setOfferError] = useState('');
    const [loading, setLoading] = useState(true);
    const [responding, setResponding] = useState(false);
    const [myChannels, setMyChannels] = useState([]);
    const [selectedChannelId, setSelectedChannelId] = useState('');
    const [showAuthPrompt, setShowAuthPrompt] = useState(false);
    const safeChannelTitle = normalizeDisplayText(offer?.channel?.channelTitle, 'Канал');
    const myChannelIds = new Set(myChannels.map((channel) => channel.id));
    const isOwnOffer = !!offer?.channel?.id && myChannelIds.has(offer.channel.id);

    useEffect(() => {
        let cancelled = false;

        async function loadOffer() {
            setLoading(true);
            setOfferError('');
            try {
                const response = await api.get(`/offers/${offerId}`);
                if (cancelled) {
                    return;
                }
                setOffer(response.data.offer || null);
            } catch (error) {
                if (!cancelled) {
                    setOffer(null);
                    setOfferError(error.response?.data?.error || 'Пропозицію не знайдено або її вже закрито.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadOffer();

        return () => {
            cancelled = true;
        };
    }, [offerId]);

    useEffect(() => {
        if (!offer) {
            applyPageSeo({
                title: 'Пропозицію не знайдено | Біржа Каналів',
                description: 'Ця пропозиція недоступна або була закрита.',
                path: `/offers/${offerId || ''}`,
                type: 'article',
                robots: 'noindex,follow',
            });
            return;
        }

        const offerTypeLabel = getOfferTypeLabel(offer.type).toLowerCase();
        applyPageSeo({
            title: `${safeChannelTitle} — ${offerTypeLabel} | Біржа Каналів`,
            description: normalizeOfferDescription(offer.description, safeChannelTitle) || `Пропозиція обміну для каналу ${safeChannelTitle}.`,
            keywords: [
                'пропозиція обміну youtube',
                'обмін підписниками',
                'обмін переглядами',
                safeChannelTitle,
            ],
            path: `/offers/${offer.id}`,
            type: 'article',
            robots: isOfferAvailableForResponse(offer) ? 'index,follow,max-image-preview:large' : 'noindex,follow',
        });
    }, [offer, offerId, safeChannelTitle]);

    useEffect(() => {
        if (!user) {
            return;
        }

        let cancelled = false;

        async function loadChannels() {
            try {
                const response = await api.get('/channels/my');
                if (cancelled) {
                    return;
                }

                const channels = response.data.channels || [];
                setMyChannels(channels);
                if (channels.length > 0) {
                    setSelectedChannelId(channels[0].id);
                }
            } catch {
                if (!cancelled) {
                    setMyChannels([]);
                    toast.error('Не вдалося завантажити ваші канали.');
                }
            }
        }

        loadChannels();

        return () => {
            cancelled = true;
        };
    }, [user]);

    async function handleRespond() {
        if (!isOfferAvailableForResponse(offer)) {
            toast.error('Ця пропозиція зараз недоступна для обміну.');
            return;
        }

        if (!user) {
            setShowAuthPrompt(true);
            return;
        }

        if (!selectedChannelId) {
            toast.error('Підключіть канал перед відгуком на пропозицію.');
            return;
        }
        if (isOwnOffer) {
            toast.error('Не можна відгукнутися на власний офер.');
            return;
        }

        setResponding(true);
        try {
            await api.post(`/offers/${offerId}/respond`, { channelId: selectedChannelId });
            toast.success('Запит на обмін надіслано.');
            navigate('/swaps/outgoing');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Не вдалося надіслати запит.');
        } finally {
            setResponding(false);
        }
    }

    return (
        <PublicLayout>
            <section className="offer-details-page">
                <div className="offer-details-inner">
                    <button className="offer-back" onClick={() => navigate('/offers')}>
                        ← До каталогу
                    </button>

                    {loading ? (
                        <div className="offer-details-empty">Завантаження пропозиції...</div>
                    ) : !offer ? (
                        <div className="offer-details-empty">{offerError || 'Пропозицію не знайдено або її вже закрито.'}</div>
                    ) : (
                        <article className="offer-details-card">
                            <header className="offer-details-head">
                                <img src={resolveChannelAvatar(offer.channel?.channelAvatar, safeChannelTitle)} data-fallback-src={buildFallbackAvatar(safeChannelTitle)} onError={handleAvatarError} alt={safeChannelTitle} />
                                <div>
                                    <h1>
                                        {safeChannelTitle}
                                        {isDemoChannel(offer.channel) && (
                                            <span className="demo-badge" title="Демо-канал" aria-label="Демо-канал">
                                                DEMO
                                            </span>
                                        )}
                                    </h1>
                                    <p>{formatPublicNumber(offer.channel?.subscribers)} підписників • {formatPublicNumber(offer.channel?.totalViews)} переглядів</p>
                                </div>
                                <span>{getOfferTypeLabel(offer.type)}</span>
                            </header>

                            <div className="offer-status-warning">
                                Статус пропозиції: <strong>{getOfferStatusLabel(offer.status)}</strong>. Можна надсилати нові запити на обмін.
                            </div>

                            <div className="offer-details-grid">
                                <div>
                                    <h3>Опис пропозиції</h3>
                                    <p>{normalizeOfferDescription(offer.description, safeChannelTitle) || 'Опис не вказаний.'}</p>
                                </div>
                                <div>
                                    <h3>Параметри обміну</h3>
                                    <ul>
                                        <li>Ніша: {normalizeDisplayText(offer.niche, 'Не вказано')}</li>
                                        <li>Мова: {normalizeDisplayText(offer.language, 'Не вказано')}</li>
                                        <li>Країна: {normalizeDisplayText(offer.channel?.country, 'Не вказано')}</li>
                                        <li>Мін. підписники: {formatPublicNumber(offer.minSubscribers || 0)}</li>
                                        <li>Макс. підписники: {offer.maxSubscribers ? formatPublicNumber(offer.maxSubscribers) : 'Без обмежень'}</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="offer-details-actions">
                                {user && myChannels.length > 0 && (
                                    <select value={selectedChannelId} onChange={(event) => setSelectedChannelId(event.target.value)}>
                                        {myChannels.map((channel) => (
                                            <option key={channel.id} value={channel.id}>
                                                {channel.channelTitle}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                <button
                                    className="primary"
                                    onClick={handleRespond}
                                    disabled={responding || (user && isOwnOffer)}
                                >
                                    {user ? (isOwnOffer ? 'Ваш офер' : 'Запропонувати обмін') : 'Увійти, щоб запропонувати обмін'}
                                </button>
                                {user && (
                                    <button
                                            onClick={() => {
                                            const prefill = encodeURIComponent(`Скарга на пропозицію ${offer.id} від каналу ${safeChannelTitle}: `);
                                            navigate(`/support/chats?prefill=${prefill}`);
                                        }}
                                    >
                                        Поскаржитися
                                    </button>
                                )}
                            </div>
                        </article>
                    )}
                </div>
            </section>
            {showAuthPrompt && (
                <div className="auth-required-modal" role="dialog" aria-modal="true">
                    <div className="auth-required-card">
                        <h3>Потрібна реєстрація</h3>
                        <p>Щоб запропонувати обмін, спочатку потрібно зареєструватися або увійти.</p>
                        <div className="auth-required-actions">
                            <button type="button" onClick={() => setShowAuthPrompt(false)}>
                                Скасувати
                            </button>
                            <button
                                type="button"
                                className="primary"
                                onClick={() => navigate(buildAuthRedirectPath(`/dashboard/offers?targetOfferId=${offerId}`))}
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


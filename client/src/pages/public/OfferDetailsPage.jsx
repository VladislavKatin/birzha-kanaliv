import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import PublicLayout from '../../components/layout/PublicLayout';
import useAuthStore from '../../stores/authStore';
import api from '../../services/api';
import { buildAuthRedirectPath } from '../../services/navigation';
import {
    buildOfferDetailsPath,
    formatPublicNumber,
    getOfferTypeLabel,
    isDemoChannel,
} from '../../services/publicOffers';
import './OfferDetailsPage.css';

export default function OfferDetailsPage() {
    const navigate = useNavigate();
    const { offerId } = useParams();
    const { user } = useAuthStore();

    const [offer, setOffer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [responding, setResponding] = useState(false);
    const [myChannels, setMyChannels] = useState([]);
    const [selectedChannelId, setSelectedChannelId] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function loadOffer() {
            setLoading(true);
            try {
                const response = await api.get(`/offers/${offerId}`);
                if (cancelled) {
                    return;
                }
                setOffer(response.data.offer || null);
            } catch {
                if (!cancelled) {
                    setOffer(null);
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
                }
            }
        }

        loadChannels();

        return () => {
            cancelled = true;
        };
    }, [user]);

    async function handleRespond() {
        if (!user) {
            navigate(buildAuthRedirectPath(buildOfferDetailsPath(offerId)));
            return;
        }

        if (!selectedChannelId) {
            toast.error('Підключіть канал перед відгуком на пропозицію.');
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
                        <div className="offer-details-empty">Пропозицію не знайдено або її вже закрито.</div>
                    ) : (
                        <article className="offer-details-card">
                            <header className="offer-details-head">
                                <img src={offer.channel?.channelAvatar || ''} alt="" />
                                <div>
                                    <h1>
                                        {offer.channel?.channelTitle || 'Канал'}
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

                            <div className="offer-details-grid">
                                <div>
                                    <h3>Опис пропозиції</h3>
                                    <p>{offer.description || 'Опис не вказаний.'}</p>
                                </div>
                                <div>
                                    <h3>Параметри обміну</h3>
                                    <ul>
                                        <li>Ніша: {offer.niche || 'Не вказано'}</li>
                                        <li>Мова: {offer.language || 'Не вказано'}</li>
                                        <li>Країна: {offer.channel?.country || 'Не вказано'}</li>
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

                                <button className="primary" onClick={handleRespond} disabled={responding}>
                                    {user ? 'Запропонувати обмін' : 'Увійти, щоб запропонувати обмін'}
                                </button>
                                {user && (
                                    <button
                                        onClick={() => {
                                            const prefill = encodeURIComponent(`Скарга на пропозицію ${offer.id} від каналу ${offer.channel?.channelTitle || 'Канал'}: `);
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
        </PublicLayout>
    );
}

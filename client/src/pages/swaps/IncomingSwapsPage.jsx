import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { buildFallbackAvatar, handleAvatarError, resolveChannelAvatar } from '../../services/avatar';
import './SwapsPage.css';

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

export default function IncomingSwapsPage() {
    const navigate = useNavigate();
    const [swaps, setSwaps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);

    useEffect(() => {
        loadSwaps();
    }, []);

    async function loadSwaps() {
        try {
            const response = await api.get('/swaps/incoming');
            setSwaps(response.data.swaps || []);
        } catch (error) {
            console.error('Failed to load incoming swaps:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleAccept(swapId) {
        setProcessing(swapId);
        try {
            await api.post(`/swaps/${swapId}/accept`);
            toast.success('Пропозицію прийнято! Відкриваємо повідомлення...');
            await loadSwaps();
            navigate(`/support/chats?thread=match-${swapId}`);
        } catch {
            toast.error('Не вдалося прийняти пропозицію');
        } finally {
            setProcessing(null);
        }
    }

    async function handleDecline(swapId) {
        setProcessing(swapId);
        try {
            await api.post(`/swaps/${swapId}/decline`);
            toast.success('Пропозицію відхилено');
            setSwaps((prev) => prev.filter((item) => item.id !== swapId));
        } catch {
            toast.error('Не вдалося відхилити пропозицію');
        } finally {
            setProcessing(null);
        }
    }

    async function handleComplete(swapId) {
        setProcessing(swapId);
        try {
            const response = await api.post(`/chat/${swapId}/complete`);
            const completed = response.data?.match?.status === 'completed';
            toast.success(completed ? 'Обмін завершено' : 'Підтверджено, очікуємо партнера');
            await loadSwaps();
        } catch (error) {
            toast.error(error?.response?.data?.error || 'Не вдалося підтвердити обмін');
        } finally {
            setProcessing(null);
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

    return (
        <div className="swaps-page">
            <div className="swaps-header">
                <h1>Вхідні запити</h1>
                <p className="swaps-subtitle">Канали, які хочуть обмінятися трафіком з вами</p>
            </div>

            {swaps.length === 0 ? (
                <div className="swaps-empty card">
                    <span className="swaps-empty-icon">📭</span>
                    <h3>Немає вхідних пропозицій</h3>
                    <p>Коли хтось захоче обмінятися з вашим каналом, ви побачите це тут</p>
                </div>
            ) : (
                <div className="swaps-list">
                    {swaps.map((swap) => (
                        <div key={swap.id} className="swap-item card">
                            <div className="swap-item-channel">
                                <img
                                    src={resolveChannelAvatar(swap.initiatorChannel?.channelAvatar, swap.initiatorChannel?.channelTitle)}
                                    data-fallback-src={buildFallbackAvatar(swap.initiatorChannel?.channelTitle)}
                                    onError={handleAvatarError}
                                    alt={swap.initiatorChannel?.channelTitle || 'Канал'}
                                    className="swap-item-avatar"
                                />
                                <div className="swap-item-info">
                                    <span className="swap-item-name">{swap.initiatorChannel?.channelTitle || 'Канал'}</span>
                                    <span className="swap-item-subs">{formatNumber(swap.initiatorChannel?.subscribers)} підписників</span>
                                    {swap.initiatorChannel?.niche && <span className="swap-item-niche">{swap.initiatorChannel.niche}</span>}
                                </div>
                            </div>

                            <div className="swap-item-details">
                                <span className="swap-item-type">
                                    Тип: {swap.offer?.type === 'subs' ? 'Підписники' : 'Перегляди'}
                                </span>
                                {swap.offer?.description && <p className="swap-item-desc">{swap.offer.description}</p>}
                                <span className="swap-item-time">{timeAgo(swap.createdAt)}</span>
                            </div>

                            <div className="swap-item-actions">
                                {swap.status === 'pending' && (
                                    <>
                                        <button className="btn btn-primary btn-sm" onClick={() => handleAccept(swap.id)} disabled={processing === swap.id}>
                                            Прийняти
                                        </button>
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDecline(swap.id)} disabled={processing === swap.id}>
                                            Відхилити
                                        </button>
                                    </>
                                )}
                                {swap.status === 'accepted' && (
                                    <>
                                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/support/chats?thread=match-${swap.id}`)}>
                                            Повідомлення
                                        </button>
                                        <button className="btn btn-primary btn-sm" onClick={() => handleComplete(swap.id)} disabled={processing === swap.id}>
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
                                            <button className="btn btn-primary btn-sm" onClick={() => navigate('/exchanges')}>
                                                Залишити відгук
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

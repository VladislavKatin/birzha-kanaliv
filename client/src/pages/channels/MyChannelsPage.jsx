import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import api from '../../services/api';
import ChannelCard from './ChannelCard';
import './ChannelsPage.css';

function getApiErrorMessage(error, fallbackMessage) {
    return error?.response?.data?.error || fallbackMessage;
}

function getCatalogVisibilityStatus(channel) {
    const reasons = [];

    if (!channel?.isActive) {
        reasons.push('канал вимкнено (перемикач «Активний»)');
    }
    if (channel?.isFlagged) {
        reasons.push('канал тимчасово обмежено модерацією');
    }
    if (!String(channel?.channelId || '').trim()) {
        reasons.push('не вдалося отримати ID каналу з YouTube');
    }

    return {
        visible: reasons.length === 0,
        reasons,
    };
}

export default function MyChannelsPage() {
    const { connectYouTube, error } = useAuthStore();
    const navigate = useNavigate();
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        loadChannels();
    }, []);

    async function loadChannels() {
        setLoadError('');
        try {
            const response = await api.get('/channels/my');
            setChannels(response.data.channels || []);
        } catch (loadChannelsError) {
            console.error('Failed to load channels:', loadChannelsError);
            const message = getApiErrorMessage(loadChannelsError, 'Не вдалося завантажити канали.');
            setLoadError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }

    async function handleToggleActive(channelId, isActive) {
        try {
            await api.put(`/channels/${channelId}`, { isActive });
            setChannels((prev) => prev.map((channel) => (channel.id === channelId ? { ...channel, isActive } : channel)));
        } catch (toggleError) {
            console.error('Toggle failed:', toggleError);
            toast.error(getApiErrorMessage(toggleError, 'Не вдалося оновити статус каналу.'));
        }
    }

    async function handleDelete(channelId) {
        try {
            await api.delete(`/channels/${channelId}`);
            setChannels((prev) => prev.filter((channel) => channel.id !== channelId));
        } catch (deleteError) {
            console.error('Delete failed:', deleteError);
            toast.error(getApiErrorMessage(deleteError, 'Не вдалося видалити канал.'));
        }
    }

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-pulse" />
                <p>Завантаження каналів...</p>
            </div>
        );
    }

    return (
        <div className="channels-page">
            <div className="channels-header">
                <div>
                    <h1>Мої канали</h1>
                    <p className="channels-subtitle">Управління підключеними YouTube-каналами</p>
                    {error ? <p className="error-text">{error}</p> : null}
                    {loadError ? <p className="error-text">{loadError}</p> : null}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {loadError ? (
                        <button className="btn btn-secondary" onClick={loadChannels}>
                            Оновити
                        </button>
                    ) : null}
                    <button className="btn btn-primary" onClick={connectYouTube}>
                        Підключити канал
                    </button>
                </div>
            </div>

            {channels.length > 0 ? (
                <>
                    <div className="card channels-visibility-card">
                        <h3>Видимість у каталозі</h3>
                        <p>
                            Канал автоматично з&apos;являється у каталозі, якщо він активний, не обмежений модерацією та має коректний YouTube ID.
                        </p>
                        <div className="channels-visibility-list">
                            {channels.map((channel) => {
                                const status = getCatalogVisibilityStatus(channel);
                                return (
                                    <div key={channel.id} className={`channels-visibility-item ${status.visible ? 'ok' : 'warn'}`}>
                                        <strong>{channel.channelTitle || 'Канал без назви'}</strong>
                                        {status.visible ? (
                                            <span>Показується в каталозі</span>
                                        ) : (
                                            <span>Не показується: {status.reasons.join('; ')}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="card channels-next-steps">
                        <h3>Що робити далі</h3>
                        <p>Після підключення каналу переходьте до пошуку партнерів і першого обміну.</p>
                        <div className="channels-next-steps-actions">
                            <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard/offers')}>
                                Відкрити каталог
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/profile/edit')}>
                                Доповнити профіль
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/settings/notifications')}>
                                Увімкнути сповіщення
                            </button>
                        </div>
                    </div>
                </>
            ) : null}

            {channels.length === 0 ? (
                <div className="channels-empty card">
                    <span className="channels-empty-icon">📺</span>
                    <h3>У вас ще немає каналів</h3>
                    <p>Підключіть свій YouTube-канал для початку роботи.</p>
                    <button className="btn btn-primary" onClick={connectYouTube}>
                        Підключити YouTube-канал
                    </button>
                </div>
            ) : (
                <div className="channels-grid">
                    {channels.map((channel) => (
                        <ChannelCard
                            key={channel.id}
                            channel={channel}
                            onToggleActive={handleToggleActive}
                            onDelete={handleDelete}
                            onViewDetail={() => navigate(`/my-channels/${channel.id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

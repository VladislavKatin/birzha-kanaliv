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

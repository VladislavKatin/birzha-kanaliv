import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import api from '../../services/api';
import ChannelCard from './ChannelCard';
import './ChannelsPage.css';

export default function MyChannelsPage() {
    const { connectYouTube } = useAuthStore();
    const navigate = useNavigate();
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadChannels();
    }, []);

    async function loadChannels() {
        try {
            const res = await api.get('/channels/my');
            setChannels(res.data.channels || []);
        } catch (error) {
            console.error('Failed to load channels:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleToggleActive(channelId, isActive) {
        try {
            await api.put(`/channels/${channelId}`, { isActive });
            setChannels(prev => prev.map(c => c.id === channelId ? { ...c, isActive } : c));
        } catch (error) {
            console.error('Toggle failed:', error);
        }
    }

    async function handleDelete(channelId) {
        try {
            await api.delete(`/channels/${channelId}`);
            setChannels(prev => prev.filter(c => c.id !== channelId));
        } catch (error) {
            console.error('Delete failed:', error);
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
                </div>
                <button className="btn btn-primary" onClick={connectYouTube}>
                    ➕ Підключити канал
                </button>
            </div>

            {channels.length === 0 ? (
                <div className="channels-empty card">
                    <span className="channels-empty-icon">📺</span>
                    <h3>У вас ще немає каналів</h3>
                    <p>Підключіть свій YouTube-канал для початку роботи</p>
                    <button className="btn btn-primary" onClick={connectYouTube}>
                        Підключити YouTube канал
                    </button>
                </div>
            ) : (
                <div className="channels-grid">
                    {channels.map(channel => (
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

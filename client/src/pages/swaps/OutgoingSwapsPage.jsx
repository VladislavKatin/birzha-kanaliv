import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './SwapsPage.css';

function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
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

const statusLabels = {
    pending: { text: 'Очікує', color: '#f59e0b' },
    accepted: { text: 'Прийнято', color: '#22c55e' },
};

export default function OutgoingSwapsPage() {
    const navigate = useNavigate();
    const [swaps, setSwaps] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSwaps();
    }, []);

    async function loadSwaps() {
        try {
            const res = await api.get('/swaps/outgoing');
            setSwaps(res.data.swaps || []);
        } catch (error) {
            console.error('Failed to load outgoing swaps:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleCancel(swapId) {
        try {
            await api.post(`/swaps/${swapId}/decline`);
            toast.success('Пропозицію скасовано');
            setSwaps(prev => prev.filter(s => s.id !== swapId));
        } catch (error) {
            toast.error('Не вдалося скасувати пропозицію');
        }
    }

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-pulse" />
                <p>Завантаження...</p>
            </div>
        );
    }

    return (
        <div className="swaps-page">
            <div className="swaps-header">
                <h1>Вихідні пропозиції</h1>
                <p className="swaps-subtitle">Ваші відгуки на пропозиції обміну</p>
            </div>

            {swaps.length === 0 ? (
                <div className="swaps-empty card">
                    <span className="swaps-empty-icon">📤</span>
                    <h3>Немає вихідних пропозицій</h3>
                    <p>Знайдіть партнера в <button className="link-btn" onClick={() => navigate('/offers')}>каталозі пропозицій</button></p>
                </div>
            ) : (
                <div className="swaps-list">
                    {swaps.map(swap => {
                        const status = statusLabels[swap.status] || statusLabels.pending;
                        return (
                            <div key={swap.id} className="swap-item card">
                                <div className="swap-item-channel">
                                    <img
                                        src={swap.targetChannel?.channelAvatar || ''}
                                        alt=""
                                        className="swap-item-avatar"
                                    />
                                    <div className="swap-item-info">
                                        <span className="swap-item-name">{swap.targetChannel?.channelTitle || 'Канал'}</span>
                                        <span className="swap-item-subs">{formatNumber(swap.targetChannel?.subscribers)} підписників</span>
                                    </div>
                                </div>

                                <div className="swap-item-details">
                                    <div className="swap-status-badge" style={{ color: status.color, borderColor: status.color }}>
                                        {status.text}
                                    </div>
                                    <span className="swap-item-time">{timeAgo(swap.createdAt)}</span>
                                </div>

                                <div className="swap-item-actions">
                                    {swap.status === 'accepted' ? (
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => navigate(`/chat/${swap.id}`)}
                                        >
                                            💬 Перейти до чату
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => handleCancel(swap.id)}
                                        >
                                            ❌ Скасувати
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

import { useState } from 'react';
import './ChannelsPage.css';

function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function getInfluenceScore(channel) {
    const subs = channel.subscribers || 0;
    const avgViews = channel.avgViews30d || 0;
    const er = subs > 0 ? (avgViews / subs) * 100 : 0;

    if (er > 20 && subs > 10000) return { score: 'A+', color: 'var(--score-a-plus)' };
    if (er > 10 && subs > 5000) return { score: 'A', color: 'var(--score-a)' };
    if (er > 5 && subs > 1000) return { score: 'B', color: 'var(--score-b)' };
    if (er > 2) return { score: 'C', color: 'var(--score-c)' };
    return { score: 'D', color: 'var(--score-d)' };
}

export default function ChannelCard({ channel, onToggleActive, onDelete, onViewDetail }) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const influence = getInfluenceScore(channel);

    return (
        <>
            <div className={`channel-card card ${!channel.isActive ? 'inactive' : ''}`}>
                <div className="channel-card-top">
                    <div className="channel-card-avatar">
                        <img
                            src={channel.channelAvatar || `https://ui-avatars.com/api/?name=${channel.channelTitle}&background=4f46e5&color=fff`}
                            alt={channel.channelTitle}
                        />
                        <div className="influence-badge" style={{ background: influence.color }}>
                            {influence.score}
                        </div>
                    </div>

                    <div className="channel-card-info">
                        <div className="channel-card-name-row">
                            <h3 className="channel-card-name">{channel.channelTitle}</h3>
                            {channel.verified ? (
                                <span className="verified-badge" title="Верифікований">✅</span>
                            ) : (
                                <span className="unverified-badge" title="Не верифікований">❌</span>
                            )}
                        </div>
                        {channel.niche && <span className="channel-card-niche">{channel.niche}</span>}
                    </div>
                </div>

                <div className="channel-card-stats">
                    <div className="channel-stat">
                        <span className="channel-stat-value">{formatNumber(channel.subscribers)}</span>
                        <span className="channel-stat-label">Підписників</span>
                    </div>
                    <div className="channel-stat">
                        <span className="channel-stat-value">{formatNumber(channel.totalViews)}</span>
                        <span className="channel-stat-label">Переглядів</span>
                    </div>
                    <div className="channel-stat">
                        <span className="channel-stat-value">{formatNumber(channel.totalVideos)}</span>
                        <span className="channel-stat-label">Відео</span>
                    </div>
                </div>

                <div className="channel-card-controls">
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={channel.isActive ?? true}
                            onChange={(e) => onToggleActive(channel.id, e.target.checked)}
                        />
                        <span className="toggle-slider" />
                        <span className="toggle-label">
                            {channel.isActive ? 'Активний' : 'Неактивний'}
                        </span>
                    </label>
                </div>

                <div className="channel-card-actions">
                    <button className="btn btn-secondary btn-sm" onClick={onViewDetail}>
                        📊 Детальна аналітика
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteModal(true)}>
                        🗑 Видалити
                    </button>
                </div>
            </div>

            {/* Delete confirmation modal */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Видалити канал?</h3>
                        <p>Ви впевнені, що хочете видалити <strong>{channel.channelTitle}</strong>? Цю дію не можна скасувати.</p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Скасувати</button>
                            <button className="btn btn-danger" onClick={() => { onDelete(channel.id); setShowDeleteModal(false); }}>
                                Видалити
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

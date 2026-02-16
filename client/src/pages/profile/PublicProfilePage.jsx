import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import api from '../../services/api';
import { buildFallbackAvatar, handleAvatarError, resolveChannelAvatar } from '../../services/avatar';
import RatingBadge from '../../components/common/RatingBadge';
import ReviewsList from '../../components/common/ReviewsList';
import './ProfilePage.css';

function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
}

const socialIcons = {
    telegram: '✈️',
    youtube: '▶️',
    tiktok: '🎵',
    facebook: '👤',
    instagram: '📸',
    twitter: '🐦',
};

export default function PublicProfilePage() {
    const { userId } = useParams();
    const { dbUser } = useAuthStore();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const isOwn = dbUser?.id === userId;

    const loadProfile = useCallback(async () => {
        setLoadError('');
        setLoading(true);
        try {
            const response = await api.get(`/profile/${userId}`);
            setProfile(response.data.profile);
        } catch (error) {
            console.error('Failed to load profile:', error);
            const message = error?.response?.data?.error || 'Не вдалося завантажити профіль.';
            setLoadError(message);
            setProfile(null);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-pulse" />
                <p>Завантаження профілю...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="profile-not-found card">
                <h3>{loadError || 'Профіль не знайдено'}</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" onClick={loadProfile}>
                        Оновити
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                        ← На головну
                    </button>
                </div>
            </div>
        );
    }

    const socials = profile.socialLinks || {};
    const hasSocials = Object.keys(socials).some((key) => socials[key]);

    return (
        <div className="profile-page">
            <div className="profile-header card">
                <div className="profile-header-top">
                    <img
                        src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName || 'U'}&background=4f46e5&color=fff&size=120`}
                        alt=""
                        className="profile-avatar-lg"
                    />
                    <div className="profile-header-info">
                        <div className="profile-name-row">
                            <h1>{profile.displayName || 'Користувач'}</h1>
                            {profile.badges?.length > 0 && (
                                <div className="profile-badges">
                                    {profile.badges.map((badge, index) => (
                                        <span key={index} className="badge badge-accent">
                                            {badge}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        {profile.professionalRole && (
                            <span className="profile-role">
                                {profile.professionalRole}
                                {profile.companyName && ` · ${profile.companyName}`}
                            </span>
                        )}
                        {profile.location && <span className="profile-location">📌 {profile.location}</span>}
                        {profile.bio && <p className="profile-bio">{profile.bio}</p>}
                    </div>
                    <div className="profile-header-actions">
                        {isOwn ? (
                            <Link to="/profile/edit" className="btn btn-secondary">
                                Редагувати
                            </Link>
                        ) : (
                            <button className="btn btn-primary" onClick={() => navigate('/offers')}>
                                Надіслати пропозицію
                            </button>
                        )}
                    </div>
                </div>

                <div className="profile-meta-row">
                    {profile.languages?.length > 0 && <span className="meta-tag">🌐 {profile.languages.join(', ')}</span>}
                    {profile.website && (
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="meta-tag meta-link">
                            🔗 {profile.website.replace(/^https?:\/\//, '')}
                        </a>
                    )}
                    <span className="meta-tag">
                        📅 На платформі з{' '}
                        {new Date(profile.createdAt).toLocaleDateString('uk-UA', {
                            month: 'long',
                            year: 'numeric',
                        })}
                    </span>
                </div>
            </div>

            {hasSocials && (
                <div className="profile-socials card">
                    <h3>Соцмережі</h3>
                    <div className="socials-grid">
                        {Object.entries(socials)
                            .filter(([, value]) => value)
                            .map(([platform, link]) => (
                                <a key={platform} href={link} target="_blank" rel="noopener noreferrer" className="social-link">
                                    <span className="social-icon">{socialIcons[platform] || '🔗'}</span>
                                    <span className="social-name">{platform}</span>
                                </a>
                            ))}
                    </div>
                </div>
            )}

            <div className="profile-stats-row">
                <div className="card profile-stat-card">
                    <span className="stat-value">{profile.stats?.completedExchanges || 0}</span>
                    <span className="stat-label">Колаборацій</span>
                </div>
                <div className="card profile-stat-card">
                    <RatingBadge rating={profile.stats?.avgRating} count={profile.stats?.reviewCount} />
                    <span className="stat-label">Рейтинг</span>
                </div>
                <div className="card profile-stat-card">
                    <span className="stat-value">{profile.channels?.length || 0}</span>
                    <span className="stat-label">Каналів</span>
                </div>
            </div>

            {profile.channels?.length > 0 && (
                <div className="profile-channels card">
                    <h3>Канали</h3>
                    <div className="profile-channels-grid">
                        {profile.channels.map((channel) => (
                            <div key={channel.id} className="profile-channel-item">
                                <img src={resolveChannelAvatar(channel.channelAvatar, channel.channelTitle)} data-fallback-src={buildFallbackAvatar(channel.channelTitle)} onError={handleAvatarError} alt={channel.channelTitle || 'Канал'} className="profile-ch-avatar" />
                                <div className="profile-ch-info">
                                    <span className="profile-ch-name">
                                        {channel.verified && <span className="verified-dot">✓</span>}
                                        {channel.channelTitle}
                                    </span>
                                    <span className="profile-ch-subs">{formatNumber(channel.subscribers)} підписників</span>
                                    {channel.niche && <span className="meta-tag small">{channel.niche}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {profile.channels?.length > 0 && (
                <div className="profile-reviews card">
                    <h3>Відгуки</h3>
                    <ReviewsList channelIds={profile.channels.map((channel) => channel.id)} />
                </div>
            )}
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import api from '../../services/api';
import RatingBadge from '../../components/common/RatingBadge';
import ReviewsList from '../../components/common/ReviewsList';
import './ProfilePage.css';

function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

const socialIcons = {
    telegram: '✈️', youtube: '▶️', tiktok: '🎵',
    facebook: '👤', instagram: '📸', twitter: '🐦',
};

export default function PublicProfilePage() {
    const { userId } = useParams();
    const { dbUser } = useAuthStore();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const isOwn = dbUser?.id === userId;

    useEffect(() => {
        loadProfile();
    }, [userId]);

    async function loadProfile() {
        try {
            const res = await api.get(`/profile/${userId}`);
            setProfile(res.data.profile);
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setLoading(false);
        }
    }

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
                <h3>Профіль не знайдено</h3>
                <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>← На головну</button>
            </div>
        );
    }

    const socials = profile.socialLinks || {};
    const hasSocials = Object.keys(socials).some(k => socials[k]);

    return (
        <div className="profile-page">
            {/* Header */}
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
                                    {profile.badges.map((b, i) => (
                                        <span key={i} className="badge badge-accent">{b}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                        {profile.professionalRole && (
                            <span className="profile-role">{profile.professionalRole}
                                {profile.companyName && ` · ${profile.companyName}`}
                            </span>
                        )}
                        {profile.location && <span className="profile-location">📍 {profile.location}</span>}
                        {profile.bio && <p className="profile-bio">{profile.bio}</p>}
                    </div>
                    <div className="profile-header-actions">
                        {isOwn ? (
                            <Link to="/profile/edit" className="btn btn-secondary">✏️ Редагувати</Link>
                        ) : (
                            <button className="btn btn-primary" onClick={() => navigate('/offers')}>
                                🤝 Надіслати пропозицію
                            </button>
                        )}
                    </div>
                </div>

                {/* Meta row */}
                <div className="profile-meta-row">
                    {profile.languages?.length > 0 && (
                        <span className="meta-tag">🌐 {profile.languages.join(', ')}</span>
                    )}
                    {profile.website && (
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="meta-tag meta-link">
                            🔗 {profile.website.replace(/^https?:\/\//, '')}
                        </a>
                    )}
                    <span className="meta-tag">📅 На платформі з {new Date(profile.createdAt).toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' })}</span>
                </div>
            </div>

            {/* Social Links */}
            {hasSocials && (
                <div className="profile-socials card">
                    <h3>Верифіковані соцмережі</h3>
                    <div className="socials-grid">
                        {Object.entries(socials).filter(([, v]) => v).map(([platform, link]) => (
                            <a key={platform} href={link} target="_blank" rel="noopener noreferrer" className="social-link">
                                <span className="social-icon">{socialIcons[platform] || '🔗'}</span>
                                <span className="social-name">{platform}</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Stats */}
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

            {/* Channels */}
            {profile.channels?.length > 0 && (
                <div className="profile-channels card">
                    <h3>Канали</h3>
                    <div className="profile-channels-grid">
                        {profile.channels.map(ch => (
                            <div key={ch.id} className="profile-channel-item">
                                <img src={ch.channelAvatar || ''} alt="" className="profile-ch-avatar" />
                                <div className="profile-ch-info">
                                    <span className="profile-ch-name">
                                        {ch.verified && <span className="verified-dot">✅</span>}
                                        {ch.channelTitle}
                                    </span>
                                    <span className="profile-ch-subs">{formatNumber(ch.subscribers)} підписників</span>
                                    {ch.niche && <span className="meta-tag small">{ch.niche}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Reviews */}
            {profile.channels?.length > 0 && (
                <div className="profile-reviews card">
                    <h3>Відгуки</h3>
                    <ReviewsList channelIds={profile.channels.map(c => c.id)} />
                </div>
            )}
        </div>
    );
}

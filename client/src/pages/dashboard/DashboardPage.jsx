import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import api from '../../services/api';
import TrustLevelCard from './TrustLevelCard';
import StatsGrid from './StatsGrid';
import RecentActivity from './RecentActivity';
import OnboardingChecklist from './OnboardingChecklist';
import InfluenceChart from '../../components/common/InfluenceChart';
import PartnerRecommendations from '../../components/common/PartnerRecommendations';
import './DashboardPage.css';

function getApiErrorMessage(error, fallbackMessage) {
    return error?.response?.data?.error || fallbackMessage;
}

export default function DashboardPage() {
    const { refreshUserData, dbUser } = useAuthStore();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        loadData();

        const params = new URLSearchParams(window.location.search);
        if (params.get('youtube') === 'connected') {
            refreshUserData();
            window.history.replaceState({}, '', '/dashboard');
        }
    }, [refreshUserData]);

    async function loadData() {
        setLoadError('');
        setLoading(true);
        try {
            const [statsRes, activityRes] = await Promise.all([api.get('/user/stats'), api.get('/user/activity?limit=5')]);
            setStats(statsRes.data);
            setActivity(activityRes.data.events || []);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            const message = getApiErrorMessage(error, 'Не вдалося завантажити дані дашборду.');
            setLoadError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-pulse" />
                <p>Завантаження даних...</p>
            </div>
        );
    }

    if (loadError && !stats) {
        return (
            <div className="dashboard-loading">
                <p>{loadError}</p>
                <button className="btn btn-secondary btn-sm" onClick={loadData}>
                    Спробувати ще раз
                </button>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <h1>Дашборд</h1>
                <p className="dashboard-subtitle">Найважливіші метрики та події вашого акаунта</p>
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-col-left">
                    <OnboardingChecklist
                        stats={stats?.stats}
                        notificationDone={Boolean(dbUser?.notificationPrefs?.telegram || dbUser?.notificationPrefs?.webpush)}
                    />
                    {stats?.stats && Number(stats.stats.totalChannels || 0) === 0 && (
                        <section className="card starter-guide-card">
                            <h3>Швидкий старт для нового акаунта</h3>
                            <p>Почніть з підключення каналу, щоб з'явитися в каталозі та отримувати перші запити на обмін.</p>
                            <div className="starter-guide-actions">
                                <button className="btn btn-primary btn-sm" onClick={() => navigate('/my-channels')}>
                                    Підключити канал
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/profile/edit')}>
                                    Заповнити профіль
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/settings/notifications')}>
                                    Увімкнути сповіщення
                                </button>
                            </div>
                        </section>
                    )}
                    <StatsGrid stats={stats?.stats} />
                    <RecentActivity events={activity} />
                </div>
                <div className="dashboard-col-right">
                    <TrustLevelCard trustLevel={stats?.trustLevel} />
                    <InfluenceChart />
                    <PartnerRecommendations />
                </div>
            </div>
        </div>
    );
}

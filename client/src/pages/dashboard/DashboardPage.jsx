import { useState, useEffect } from 'react';
import useAuthStore from '../../stores/authStore';
import api from '../../services/api';
import TrustLevelCard from './TrustLevelCard';
import StatsGrid from './StatsGrid';
import RecentActivity from './RecentActivity';
import QuickActions from './QuickActions';
import InfluenceChart from '../../components/common/InfluenceChart';
import PartnerRecommendations from '../../components/common/PartnerRecommendations';
import './DashboardPage.css';

export default function DashboardPage() {
    const { youtubeConnected, refreshUserData } = useAuthStore();
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();

        const params = new URLSearchParams(window.location.search);
        if (params.get('youtube') === 'connected') {
            refreshUserData();
            window.history.replaceState({}, '', '/dashboard');
        }
    }, [refreshUserData]);

    async function loadData() {
        try {
            const [statsRes, activityRes] = await Promise.all([api.get('/user/stats'), api.get('/user/activity?limit=5')]);
            setStats(statsRes.data);
            setActivity(activityRes.data.events || []);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
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

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <h1>Дашборд</h1>
                <p className="dashboard-subtitle">Огляд активності вашого акаунта на платформі</p>
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-col-left">
                    <TrustLevelCard trustLevel={stats?.trustLevel} />
                    <QuickActions youtubeConnected={youtubeConnected} />
                    <PartnerRecommendations />
                </div>
                <div className="dashboard-col-right">
                    <StatsGrid stats={stats?.stats} />
                    <InfluenceChart />
                    <RecentActivity events={activity} />
                </div>
            </div>
        </div>
    );
}

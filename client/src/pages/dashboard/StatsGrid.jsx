import './DashboardPage.css';

const statItems = [
    { key: 'channels', label: 'Канали', icon: '📺', getValue: (s) => `${s?.totalChannels || 0} / ${s?.verifiedChannels || 0} ✓` },
    { key: 'swaps', label: 'Активні пропозиції', icon: '🔄', getValue: (s) => `${s?.incomingSwaps || 0} вх / ${s?.outgoingSwaps || 0} вих` },
    { key: 'completed', label: 'Завершені обміни', icon: '✅', getValue: (s) => `${s?.completedExchanges || 0}` },
    { key: 'rating', label: 'Середній рейтинг', icon: '⭐', getValue: (s) => s?.avgRating ? `${s.avgRating} (${s.reviewCount})` : 'Немає відгуків' },
];

export default function StatsGrid({ stats }) {
    return (
        <div className="stats-grid">
            {statItems.map((item) => (
                <div key={item.key} className="stat-card card">
                    <div className="stat-icon">{item.icon}</div>
                    <div className="stat-info">
                        <span className="stat-value">{item.getValue(stats)}</span>
                        <span className="stat-label">{item.label}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

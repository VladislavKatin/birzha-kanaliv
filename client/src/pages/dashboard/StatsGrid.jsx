import Icon from '../../components/common/Icon';
import './DashboardPage.css';

const statItems = [
    {
        key: 'channels',
        label: 'Канали',
        icon: 'youtube',
        getValue: (s) => `${s?.totalChannels || 0} / ${s?.verifiedChannels || 0} підтверджено`,
    },
    {
        key: 'swaps',
        label: 'Активні запити',
        icon: 'exchange',
        getValue: (s) => `${s?.incomingSwaps || 0} вхідних / ${s?.outgoingSwaps || 0} вихідних`,
    },
    {
        key: 'completed',
        label: 'Завершені обміни',
        icon: 'check',
        getValue: (s) => `${s?.completedExchanges || 0}`,
    },
    {
        key: 'rating',
        label: 'Середній рейтинг',
        icon: 'star',
        getValue: (s) => (s?.avgRating ? `${s.avgRating} (${s.reviewCount})` : 'Поки що немає відгуків'),
    },
];

export default function StatsGrid({ stats }) {
    return (
        <div className="stats-grid">
            {statItems.map((item) => (
                <div key={item.key} className="stat-card card">
                    <div className="stat-icon">
                        <Icon name={item.icon} size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{item.getValue(stats)}</span>
                        <span className="stat-label">{item.label}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

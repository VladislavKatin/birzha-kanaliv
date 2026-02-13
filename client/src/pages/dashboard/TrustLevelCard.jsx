import './DashboardPage.css';

const LEVELS = [
    { name: 'Новачок', minPoints: 0, color: '#94a3b8', bgColor: 'rgba(148, 163, 184, 0.18)' },
    { name: 'Підтверджений', minPoints: 25, color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.16)' },
    { name: 'Перевірений', minPoints: 50, color: '#1f6fd6', bgColor: 'rgba(31, 111, 214, 0.16)' },
    { name: 'Експерт', minPoints: 80, color: '#16a34a', bgColor: 'rgba(22, 163, 74, 0.16)' },
];

export default function TrustLevelCard({ trustLevel }) {
    if (!trustLevel) return null;

    const { level, color, points, progress } = trustLevel;
    const currentLevelData = LEVELS.find((item) => item.name === level) || LEVELS[0];

    return (
        <div className="trust-card card">
            <div className="trust-header">
                <h3 className="trust-title">Мій рівень довіри</h3>
                <div className="trust-badge" style={{ background: currentLevelData.bgColor, color: currentLevelData.color }}>
                    {level}
                </div>
            </div>

            <div className="trust-score">
                <div className="trust-score-circle" style={{ borderColor: color }}>
                    <span className="trust-score-value">{points}</span>
                    <span className="trust-score-label">балів</span>
                </div>
            </div>

            <div className="trust-progress-section">
                <div className="trust-progress-header">
                    <span>Прогрес до наступного рівня</span>
                    <span className="trust-progress-pct">{progress}%</span>
                </div>
                <div className="trust-progress-bar">
                    <div className="trust-progress-fill" style={{ width: `${progress}%`, backgroundColor: color }} />
                </div>
            </div>

            <div className="trust-levels-row">
                {LEVELS.map((item) => (
                    <div
                        key={item.name}
                        className={`trust-level-dot ${item.name === level ? 'active' : ''}`}
                        style={{ '--dot-color': item.color }}
                        title={item.name}
                    >
                        <div className="dot" />
                        <span>{item.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

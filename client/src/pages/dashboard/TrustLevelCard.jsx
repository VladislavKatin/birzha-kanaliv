import './DashboardPage.css';

const LEVELS = [
    { name: 'Новачок', minPoints: 0, color: '#a1a1b5', bgColor: 'rgba(161, 161, 181, 0.12)' },
    { name: 'Підтверджений', minPoints: 25, color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.12)' },
    { name: 'Перевірений', minPoints: 50, color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.12)' },
    { name: 'Експерт', minPoints: 80, color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.12)' },
];

export default function TrustLevelCard({ trustLevel }) {
    if (!trustLevel) return null;

    const { level, color, points, progress, nextThreshold } = trustLevel;
    const currentLevelData = LEVELS.find(l => l.name === level) || LEVELS[0];

    return (
        <div className="trust-card card">
            <div className="trust-header">
                <h3 className="trust-title">Мій рівень довіри</h3>
                <div
                    className="trust-badge"
                    style={{ background: currentLevelData.bgColor, color: currentLevelData.color }}
                >
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
                    <div
                        className="trust-progress-fill"
                        style={{ width: `${progress}%`, backgroundColor: color }}
                    />
                </div>
            </div>

            <div className="trust-levels-row">
                {LEVELS.map((l) => (
                    <div
                        key={l.name}
                        className={`trust-level-dot ${l.name === level ? 'active' : ''}`}
                        style={{ '--dot-color': l.color }}
                        title={l.name}
                    >
                        <div className="dot" />
                        <span>{l.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

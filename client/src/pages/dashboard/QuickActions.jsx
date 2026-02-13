import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import './DashboardPage.css';

export default function QuickActions({ youtubeConnected }) {
    const { connectYouTube } = useAuthStore();
    const navigate = useNavigate();

    const actions = [
        {
            icon: '➕',
            label: 'Додати канал',
            description: 'Підключити YouTube через OAuth',
            onClick: connectYouTube,
            gradient: 'linear-gradient(135deg, #ef4444, #f97316)',
        },
        {
            icon: '🔍',
            label: 'Знайти партнера',
            description: 'Переглянути каталог пропозицій',
            onClick: () => navigate('/offers'),
            gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)',
        },
        {
            icon: '📊',
            label: 'Мої канали',
            description: 'Статистика та управління',
            onClick: () => navigate('/my-channels'),
            gradient: 'linear-gradient(135deg, #22c55e, #10b981)',
        },
        {
            icon: '📥',
            label: 'Вхідні запити',
            description: 'Перегляд запитів на обмін',
            onClick: () => navigate('/swaps/incoming'),
            gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
        },
        {
            icon: '📤',
            label: 'Вихідні запити',
            description: 'Мої надіслані пропозиції',
            onClick: () => navigate('/swaps/outgoing'),
            gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
        },
        {
            icon: '🤝',
            label: 'Активні обміни',
            description: 'Поточні партнерства',
            onClick: () => navigate('/exchanges'),
            gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)',
        },
        {
            icon: '👤',
            label: 'Мій профіль',
            description: 'Редагувати профіль',
            onClick: () => navigate('/profile/edit'),
            gradient: 'linear-gradient(135deg, #64748b, #94a3b8)',
        },
        {
            icon: '🔔',
            label: 'Сповіщення',
            description: 'Налаштування сповіщень',
            onClick: () => navigate('/settings/notifications'),
            gradient: 'linear-gradient(135deg, #ec4899, #f472b6)',
        },
    ];

    return (
        <div className="quick-actions card">
            <h3 className="quick-actions-title">Швидкі дії</h3>
            <div className="quick-actions-list">
                {actions.map((action) => (
                    <button
                        key={action.label}
                        className="quick-action-btn"
                        onClick={action.onClick}
                    >
                        <div className="quick-action-icon" style={{ background: action.gradient }}>
                            {action.icon}
                        </div>
                        <div className="quick-action-text">
                            <span className="quick-action-label">{action.label}</span>
                            <span className="quick-action-desc">{action.description}</span>
                        </div>
                        <span className="quick-action-arrow">→</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

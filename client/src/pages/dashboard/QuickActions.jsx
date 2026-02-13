import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import Icon from '../../components/common/Icon';
import './DashboardPage.css';

export default function QuickActions({ youtubeConnected }) {
    const { connectYouTube } = useAuthStore();
    const navigate = useNavigate();

    const actions = [
        {
            icon: 'plus',
            label: youtubeConnected ? 'Додати ще канал' : 'Підключити канал',
            description: 'Підключення YouTube через безпечний OAuth',
            onClick: connectYouTube,
            tone: 'accent',
        },
        {
            icon: 'search',
            label: 'Знайти партнера',
            description: 'Перейти до каталогу пропозицій обміну',
            onClick: () => navigate('/offers'),
            tone: 'blue',
        },
        {
            icon: 'youtube',
            label: 'Мої канали',
            description: 'Статистика, налаштування та синхронізація',
            onClick: () => navigate('/my-channels'),
            tone: 'green',
        },
        {
            icon: 'messages',
            label: 'Вхідні запити',
            description: 'Нові пропозиції від інших каналів',
            onClick: () => navigate('/swaps/incoming'),
            tone: 'violet',
        },
        {
            icon: 'message',
            label: 'Вихідні запити',
            description: 'Ваші надіслані пропозиції обміну',
            onClick: () => navigate('/swaps/outgoing'),
            tone: 'amber',
        },
        {
            icon: 'handshake',
            label: 'Активні обміни',
            description: 'Поточні угоди та прогрес виконання',
            onClick: () => navigate('/exchanges'),
            tone: 'teal',
        },
        {
            icon: 'user',
            label: 'Мій профіль',
            description: 'Редагування опису, контактів та посилань',
            onClick: () => navigate('/profile/edit'),
            tone: 'slate',
        },
        {
            icon: 'bell',
            label: 'Сповіщення',
            description: 'Канали отримання та пріоритет подій',
            onClick: () => navigate('/settings/notifications'),
            tone: 'rose',
        },
    ];

    return (
        <div className="quick-actions card">
            <h3 className="quick-actions-title">Швидкі дії</h3>
            <div className="quick-actions-list">
                {actions.map((action) => (
                    <button key={action.label} className="quick-action-btn" onClick={action.onClick}>
                        <div className={`quick-action-icon ${action.tone}`}>
                            <Icon name={action.icon} size={18} />
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

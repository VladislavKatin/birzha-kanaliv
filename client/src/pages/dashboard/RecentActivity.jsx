import { useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import { normalizeDisplayText } from '../../services/publicOffers';
import './DashboardPage.css';

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Щойно';
    if (minutes < 60) return `${minutes} хв тому`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} год тому`;
    const days = Math.floor(hours / 24);
    return `${days} дн тому`;
}

const typeIcons = {
    swap: 'exchange',
    review: 'star',
    message: 'message',
};

export default function RecentActivity({ events }) {
    const navigate = useNavigate();

    if (!events || events.length === 0) {
        return (
            <div className="activity-card card">
                <h3 className="activity-title">Останні події</h3>
                <div className="activity-empty">
                    <span className="activity-empty-icon">
                        <Icon name="clock" size={28} />
                    </span>
                    <p>Подій поки що немає</p>
                </div>
            </div>
        );
    }

    return (
        <div className="activity-card card">
            <h3 className="activity-title">Останні події</h3>
            <div className="activity-list">
                {events.map((event) => {
                    const safeTitle = normalizeDisplayText(event.title, 'Подія');
                    const safePreview = normalizeDisplayText(event.preview, '');

                    return (
                        <div key={event.id} className="activity-item" onClick={() => event.link && navigate(event.link)} role="button" tabIndex={0}>
                            <div className="activity-item-avatar">
                                {event.avatar ? <img src={event.avatar} alt="" /> : <Icon name={typeIcons[event.type] || 'info'} size={16} />}
                            </div>
                            <div className="activity-item-content">
                                <span className="activity-item-title">{safeTitle}</span>
                                {safePreview && <span className="activity-item-preview">{safePreview}</span>}
                            </div>
                            <span className="activity-item-time">{timeAgo(event.date)}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

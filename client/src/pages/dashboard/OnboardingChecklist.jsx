import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OnboardingChecklist({ stats, notificationDone = false }) {
    const navigate = useNavigate();

    const items = useMemo(() => {
        const totalChannels = Number(stats?.totalChannels || 0);
        const completedExchanges = Number(stats?.completedExchanges || 0);

        return [
            {
                key: 'channel',
                title: 'Підключити YouTube-канал',
                done: totalChannels > 0,
                action: () => navigate('/my-channels'),
                actionLabel: 'До каналів',
            },
            {
                key: 'offer',
                title: 'Активувати канал у каталозі',
                done: Number(stats?.outgoingSwaps || 0) > 0 || Number(stats?.incomingSwaps || 0) > 0,
                action: () => navigate('/dashboard/offers'),
                actionLabel: 'До пропозицій',
            },
            {
                key: 'exchange',
                title: 'Завершити перший обмін',
                done: completedExchanges > 0,
                action: () => navigate('/exchanges'),
                actionLabel: 'До обмінів',
            },
            {
                key: 'notifications',
                title: 'Налаштувати сповіщення',
                done: notificationDone,
                action: () => navigate('/settings/notifications'),
                actionLabel: 'Налаштувати',
            },
        ];
    }, [navigate, notificationDone, stats]);

    const doneCount = items.filter((item) => item.done).length;

    return (
        <section className="card onboarding-card">
            <div className="onboarding-head">
                <h3>План старту</h3>
                <span>{doneCount}/{items.length} виконано</span>
            </div>
            <div className="onboarding-list">
                {items.map((item) => (
                    <div key={item.key} className="onboarding-item">
                        <span className={`onboarding-state ${item.done ? 'done' : ''}`} aria-hidden="true" />
                        <p>{item.title}</p>
                        {!item.done && (
                            <button className="btn btn-secondary btn-sm" onClick={item.action}>{item.actionLabel}</button>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}

import { useState, useEffect } from 'react';
import useAuthStore from '../../stores/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './SettingsPage.css';

export default function NotificationSettingsPage() {
    const { dbUser } = useAuthStore();
    const [prefs, setPrefs] = useState({
        email_new_proposal: true,
        email_message: true,
        email_deal_complete: true,
        telegram: false,
        webpush: false,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (dbUser?.notificationPrefs) {
            setPrefs((prev) => ({ ...prev, ...dbUser.notificationPrefs }));
        }
    }, [dbUser]);

    function toggle(key) {
        setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    }

    async function handleSave() {
        setSaving(true);
        try {
            await api.put('/profile/notifications', { notificationPrefs: prefs });
            toast.success('Сповіщення збережено');
        } catch {
            toast.error('Не вдалося зберегти');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="settings-page">
            <div className="settings-header">
                <h1>Сповіщення</h1>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Збереження...' : 'Зберегти'}
                </button>
            </div>

            <div className="card settings-section">
                <h3>Telegram</h3>
                <p className="section-desc">Отримуйте миттєві сповіщення через Telegram-бота</p>
                <div className="toggle-row">
                    <span>Telegram-сповіщення</span>
                    <button className={`toggle-switch ${prefs.telegram ? 'on' : ''}`} onClick={() => toggle('telegram')}>
                        <span className="toggle-thumb" />
                    </button>
                </div>
                {prefs.telegram && (
                    <div className="connect-hint">
                        <span>Посилання:</span>{' '}
                        <a href="https://t.me/youtoobe_bot" target="_blank" rel="noopener noreferrer">
                            @youtoobe_bot
                        </a>{' '}
                        та команда `/start`
                    </div>
                )}
            </div>

            <div className="card settings-section">
                <h3>Push-сповіщення</h3>
                <p className="section-desc">Сповіщення в браузері навіть коли вкладка закрита</p>
                <div className="toggle-row">
                    <span>Push-сповіщення</span>
                    <button className={`toggle-switch ${prefs.webpush ? 'on' : ''}`} onClick={() => toggle('webpush')}>
                        <span className="toggle-thumb" />
                    </button>
                </div>
            </div>

            <div className="card settings-section">
                <h3>Email-сповіщення</h3>
                <p className="section-desc">Оберіть, про що вас сповіщати на email</p>
                <div className="toggle-row">
                    <span>Нова пропозиція обміну</span>
                    <button className={`toggle-switch ${prefs.email_new_proposal ? 'on' : ''}`} onClick={() => toggle('email_new_proposal')}>
                        <span className="toggle-thumb" />
                    </button>
                </div>
                <div className="toggle-row">
                    <span>Нове повідомлення в чаті</span>
                    <button className={`toggle-switch ${prefs.email_message ? 'on' : ''}`} onClick={() => toggle('email_message')}>
                        <span className="toggle-thumb" />
                    </button>
                </div>
                <div className="toggle-row">
                    <span>Завершення угоди</span>
                    <button className={`toggle-switch ${prefs.email_deal_complete ? 'on' : ''}`} onClick={() => toggle('email_deal_complete')}>
                        <span className="toggle-thumb" />
                    </button>
                </div>
            </div>
        </div>
    );
}

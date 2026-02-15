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
    const [telegramInfo, setTelegramInfo] = useState({
        configured: null,
        botUsername: null,
        deepLink: null,
        connected: false,
        telegramUsername: null,
        telegramChatId: null,
        telegramLinkedAt: null,
    });
    const [loadingTelegram, setLoadingTelegram] = useState(false);
    const [telegramLoadError, setTelegramLoadError] = useState('');
    const [sendingTelegramTest, setSendingTelegramTest] = useState(false);
    const [disconnectingTelegram, setDisconnectingTelegram] = useState(false);
    const [webPushSupported, setWebPushSupported] = useState(false);
    const [webPushPermission, setWebPushPermission] = useState('default');
    const [sendingWebPushTest, setSendingWebPushTest] = useState(false);

    useEffect(() => {
        if (dbUser?.notificationPrefs) {
            setPrefs((prev) => ({ ...prev, ...dbUser.notificationPrefs }));
        }
    }, [dbUser]);

    useEffect(() => {
        if (!dbUser?.id) return;
        loadTelegramInfo();
    }, [dbUser?.id]);

    useEffect(() => {
        const supported = typeof window !== 'undefined' && 'Notification' in window;
        setWebPushSupported(supported);
        if (supported) {
            setWebPushPermission(Notification.permission);
        }
    }, []);

    function toggle(key) {
        setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    }

    async function handleSave() {
        setSaving(true);
        try {
            const payload = { ...prefs };
            if (payload.telegram && !telegramInfo.connected) {
                toast.error('Спочатку підключіть Telegram-бота');
                setSaving(false);
                return;
            }
            if (payload.webpush && !webPushSupported) {
                toast.error('Push-сповіщення не підтримуються у вашому браузері');
                setSaving(false);
                return;
            }
            if (payload.webpush && webPushPermission !== 'granted') {
                const granted = await ensureWebPushPermission();
                if (!granted) {
                    toast.error('Дозвольте push-сповіщення у браузері');
                    setSaving(false);
                    return;
                }
            }
            await api.put('/profile/notifications', { notificationPrefs: payload });
            toast.success('Сповіщення збережено');
        } catch (error) {
            toast.error(error?.response?.data?.error || 'Не вдалося зберегти');
        } finally {
            setSaving(false);
        }
    }

    async function ensureWebPushPermission() {
        if (!webPushSupported) return false;
        if (Notification.permission === 'granted') {
            setWebPushPermission('granted');
            return true;
        }

        const permission = await Notification.requestPermission();
        setWebPushPermission(permission);
        return permission === 'granted';
    }

    async function handleToggleWebPush() {
        if (!prefs.webpush) {
            const granted = await ensureWebPushPermission();
            if (!granted) {
                toast.error('Без дозволу браузера push-сповіщення недоступні');
                return;
            }
        }
        toggle('webpush');
    }

    async function handleWebPushTest() {
        if (!webPushSupported) {
            toast.error('Push-сповіщення не підтримуються у вашому браузері');
            return;
        }

        setSendingWebPushTest(true);
        try {
            const granted = await ensureWebPushPermission();
            if (!granted) {
                toast.error('Дозвіл на push-сповіщення не надано');
                return;
            }

            const title = 'Біржа Каналів';
            const options = {
                body: 'Тестове push-сповіщення працює.',
                icon: '/vite.svg',
                badge: '/vite.svg',
                tag: 'birzha-webpush-test',
            };

            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                await registration.showNotification(title, options);
            } else {
                new Notification(title, options);
            }
            toast.success('Тестове push-сповіщення надіслано');
        } catch (error) {
            toast.error(error?.message || 'Не вдалося показати push-сповіщення');
        } finally {
            setSendingWebPushTest(false);
        }
    }

    async function loadTelegramInfo() {
        if (!dbUser?.id) return;
        setLoadingTelegram(true);
        setTelegramLoadError('');
        try {
            const response = await api.get('/profile/notifications/telegram-link');
            setTelegramInfo(response.data || {});
        } catch (error) {
            const message = error?.response?.data?.error || 'Не вдалося отримати Telegram-налаштування';
            setTelegramLoadError(message);
            toast.error(message);
        } finally {
            setLoadingTelegram(false);
        }
    }

    async function handleSendTelegramTest() {
        setSendingTelegramTest(true);
        try {
            await api.post('/profile/notifications/telegram-test');
            toast.success('Тестове повідомлення надіслано');
        } catch (error) {
            toast.error(error?.response?.data?.error || 'Не вдалося надіслати тест');
        } finally {
            setSendingTelegramTest(false);
        }
    }

    async function handleDisconnectTelegram() {
        setDisconnectingTelegram(true);
        try {
            await api.delete('/profile/notifications/telegram-link');
            setPrefs((prev) => ({ ...prev, telegram: false }));
            await loadTelegramInfo();
            toast.success('Telegram відключено');
        } catch (error) {
            toast.error(error?.response?.data?.error || 'Не вдалося відключити Telegram');
        } finally {
            setDisconnectingTelegram(false);
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
                {!!telegramLoadError && !loadingTelegram && (
                    <div className="connect-hint">{telegramLoadError}</div>
                )}
                {telegramInfo.configured === false && !loadingTelegram && !telegramLoadError && (
                    <div className="connect-hint">Telegram-бот ще не налаштований на сервері.</div>
                )}
                {telegramInfo.configured === true && (
                    <div className="connect-hint">
                        {telegramInfo.connected
                            ? `Підключено як ${telegramInfo.telegramUsername ? `@${telegramInfo.telegramUsername}` : 'Telegram-користувач'}`
                            : 'Telegram не підключений'}
                    </div>
                )}
                {telegramInfo.configured === true && telegramInfo.deepLink && (
                    <div className="settings-actions-row">
                        <a className="btn btn-secondary btn-sm" href={telegramInfo.deepLink} target="_blank" rel="noopener noreferrer">
                            Підключити Telegram
                        </a>
                        <button className="btn btn-secondary btn-sm" onClick={loadTelegramInfo} disabled={loadingTelegram}>
                            {loadingTelegram ? 'Оновлення...' : 'Оновити статус'}
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={handleSendTelegramTest} disabled={!telegramInfo.connected || sendingTelegramTest}>
                            {sendingTelegramTest ? 'Надсилання...' : 'Тест повідомлення'}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={handleDisconnectTelegram} disabled={!telegramInfo.connected || disconnectingTelegram}>
                            {disconnectingTelegram ? 'Відключення...' : 'Відключити'}
                        </button>
                    </div>
                )}
            </div>

            <div className="card settings-section">
                <h3>Push-сповіщення</h3>
                <p className="section-desc">Сповіщення в браузері навіть коли вкладка закрита</p>
                <div className="toggle-row">
                    <span>Push-сповіщення</span>
                    <button
                        className={`toggle-switch ${prefs.webpush ? 'on' : ''}`}
                        onClick={handleToggleWebPush}
                        disabled={!webPushSupported}
                        title={!webPushSupported ? 'Браузер не підтримує push-сповіщення' : ''}
                    >
                        <span className="toggle-thumb" />
                    </button>
                </div>
                <div className="connect-hint">
                    {webPushSupported
                        ? `Дозвіл браузера: ${webPushPermission === 'granted' ? 'дозволено' : webPushPermission === 'denied' ? 'заборонено' : 'ще не надано'}`
                        : 'Ваш браузер не підтримує push-сповіщення'}
                </div>
                <div className="settings-actions-row">
                    <button className="btn btn-secondary btn-sm" onClick={handleWebPushTest} disabled={!webPushSupported || sendingWebPushTest}>
                        {sendingWebPushTest ? 'Надсилання...' : 'Тест push'}
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

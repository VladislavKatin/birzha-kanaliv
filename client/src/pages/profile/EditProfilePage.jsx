import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './ProfilePage.css';

const LANGUAGES = ['Українська', 'English', 'Русский', 'Deutsch', 'Español', 'Français', 'Polski', 'Türkçe', 'العربية', '中文', '日本語'];

const SOCIAL_PLATFORMS = [
    { key: 'telegram', label: 'Telegram', icon: '✈️' },
    { key: 'youtube', label: 'YouTube', icon: '▶️' },
    { key: 'tiktok', label: 'TikTok', icon: '🎵' },
    { key: 'instagram', label: 'Instagram', icon: '📸' },
    { key: 'facebook', label: 'Facebook', icon: '👤' },
    { key: 'twitter', label: 'Twitter/X', icon: '🐦' },
];

const SOCIAL_SUGGESTED_PREFIXES = {
    telegram: 'https://t.me/',
    youtube: 'https://youtube.com/@',
    tiktok: 'https://www.tiktok.com/@',
    instagram: 'https://www.instagram.com/',
    facebook: 'https://www.facebook.com/',
    twitter: 'https://x.com/',
};

const PRIVACY_FIELDS = [
    { key: 'bio', label: 'Біографія' },
    { key: 'location', label: 'Локація' },
    { key: 'languages', label: 'Мови' },
    { key: 'birthYear', label: 'Рік народження' },
    { key: 'gender', label: 'Стать' },
    { key: 'professionalRole', label: 'Роль' },
    { key: 'companyName', label: 'Компанія' },
    { key: 'website', label: 'Вебсайт' },
    { key: 'socialLinks', label: 'Соцмережі' },
];

export default function EditProfilePage() {
    const { dbUser, refreshUserData } = useAuthStore();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        displayName: '',
        bio: '',
        location: '',
        languages: [],
        birthYear: '',
        gender: '',
        professionalRole: '',
        companyName: '',
        website: '',
        socialLinks: {},
    });
    const [privacy, setPrivacy] = useState({});
    const [saving, setSaving] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [networkInfo, setNetworkInfo] = useState(null);
    const [networkLoading, setNetworkLoading] = useState(false);

    useEffect(() => {
        if (!dbUser) return;

        setForm({
            displayName: dbUser.displayName || '',
            bio: dbUser.bio || '',
            location: dbUser.location || '',
            languages: dbUser.languages || [],
            birthYear: dbUser.birthYear || '',
            gender: dbUser.gender || '',
            professionalRole: dbUser.professionalRole || '',
            companyName: dbUser.companyName || '',
            website: dbUser.website || '',
            socialLinks: dbUser.socialLinks || {},
        });
        setPrivacy(dbUser.privacySettings || {});
        setAvatarPreview(dbUser.photoURL || null);
    }, [dbUser]);

    useEffect(() => {
        if (!dbUser) return;
        loadNetworkInfo();
    }, [dbUser]);

    function updateField(key, value) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function toggleLanguage(language) {
        setForm((prev) => ({
            ...prev,
            languages: prev.languages.includes(language)
                ? prev.languages.filter((item) => item !== language)
                : [...prev.languages, language],
        }));
    }

    function updateSocial(platform, value) {
        setForm((prev) => ({
            ...prev,
            socialLinks: { ...prev.socialLinks, [platform]: value },
        }));
    }

    function handleSocialAdd(platform) {
        if (platform === 'youtube') {
            navigate('/my-channels');
            return;
        }

        const currentValue = String(form.socialLinks?.[platform] || '').trim();
        if (currentValue) {
            return;
        }

        const prefix = SOCIAL_SUGGESTED_PREFIXES[platform] || 'https://';
        updateSocial(platform, prefix);
    }

    function updatePrivacy(field, value) {
        setPrivacy((prev) => ({ ...prev, [field]: value }));
    }

    async function loadNetworkInfo() {
        setNetworkLoading(true);
        try {
            const response = await api.get('/profile/network-info');
            setNetworkInfo(response.data || null);
        } catch {
            setNetworkInfo(null);
        } finally {
            setNetworkLoading(false);
        }
    }

    async function handleAvatarChange(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Максимальний розмір файлу: 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (loadEvent) => {
            const base64 = loadEvent.target?.result;
            if (!base64) return;

            setAvatarPreview(String(base64));
            try {
                await api.post('/profile/avatar', { avatar: base64 });
                toast.success('Аватар оновлено');
            } catch {
                toast.error('Не вдалося завантажити аватар');
            }
        };
        reader.readAsDataURL(file);
    }

    async function handleSave() {
        setSaving(true);
        try {
            await api.put('/profile', form);
            await api.put('/profile/privacy', { privacySettings: privacy });
            toast.success('Профіль збережено!');
            refreshUserData();
        } catch {
            toast.error('Не вдалося зберегти');
        } finally {
            setSaving(false);
        }
    }

    async function handleExportData() {
        try {
            const response = await api.get('/gdpr/export');
            const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = 'my-data-export.json';
            anchor.click();
            URL.revokeObjectURL(url);
            toast.success('Дані завантажено');
        } catch {
            toast.error('Не вдалося експортувати дані');
        }
    }

    async function handleDeleteAccount() {
        if (deleteConfirm !== 'ВИДАЛИТИ') return;

        try {
            await api.delete('/gdpr/account', { data: { confirmation: 'DELETE_MY_ACCOUNT' } });
            toast.success('Акаунт видалено');
            navigate('/auth');
        } catch {
            toast.error('Не вдалося видалити акаунт');
        }
    }

    return (
        <div className="edit-profile-page">
            <div className="edit-profile-header">
                <div>
                    <h1>Редагування профілю</h1>
                    <p className="edit-profile-subtitle">Оновіть публічну інформацію та керуйте тим, що бачать інші користувачі.</p>
                </div>
                <div className="edit-profile-header-actions">
                    <button className="btn btn-secondary" onClick={() => navigate('/profile')}>
                        Переглянути профіль
                    </button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Збереження...' : 'Зберегти'}
                    </button>
                </div>
            </div>

            <div className="card edit-section network-info-section">
                <div className="network-info-head">
                    <h3>Мережева інформація</h3>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={loadNetworkInfo} disabled={networkLoading}>
                        {networkLoading ? 'Оновлення...' : 'Оновити'}
                    </button>
                </div>
                <p className="section-desc">IP-адреса, провайдер і місто визначаються автоматично для вашого поточного входу.</p>
                <div className="network-info-grid">
                    <div className="network-info-item">
                        <span>IP</span>
                        <strong>{networkInfo?.networkInfo?.ip || 'Невідомо'}</strong>
                    </div>
                    <div className="network-info-item">
                        <span>Провайдер</span>
                        <strong>{networkInfo?.networkInfo?.provider || 'Невідомо'}</strong>
                    </div>
                    <div className="network-info-item">
                        <span>Місто</span>
                        <strong>{networkInfo?.networkInfo?.city || 'Невідомо'}</strong>
                    </div>
                    <div className="network-info-item">
                        <span>Країна</span>
                        <strong>{networkInfo?.networkInfo?.country || 'Невідомо'}</strong>
                    </div>
                </div>
                <div className="network-info-actions">
                    <small>Остання перевірка: {networkInfo?.checkedAt ? new Date(networkInfo.checkedAt).toLocaleString('uk-UA') : 'ще не виконувалась'}</small>
                </div>
            </div>

            <div className="card edit-section">
                <h3>Аватар</h3>
                <div className="avatar-upload">
                    <img
                        src={avatarPreview || `https://ui-avatars.com/api/?name=${form.displayName || 'U'}&background=4f46e5&color=fff&size=100`}
                        alt=""
                        className="avatar-preview"
                    />
                    <label className="btn btn-secondary btn-sm avatar-btn">
                        Змінити фото
                        <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
                    </label>
                </div>
            </div>

            <div className="card edit-section">
                <h3>Основна інформація</h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Ім'я</label>
                        <input className="form-input" value={form.displayName} onChange={(event) => updateField('displayName', event.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Локація</label>
                        <input className="form-input" placeholder="Київ, Україна" value={form.location} onChange={(event) => updateField('location', event.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Роль</label>
                        <input className="form-input" placeholder="Content Creator" value={form.professionalRole} onChange={(event) => updateField('professionalRole', event.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Компанія <span className="optional">(необов'язково)</span></label>
                        <input className="form-input" value={form.companyName} onChange={(event) => updateField('companyName', event.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Вебсайт</label>
                        <input className="form-input" type="url" placeholder="https://" value={form.website} onChange={(event) => updateField('website', event.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Рік народження <span className="optional">(необов'язково)</span></label>
                        <input className="form-input" type="number" min="1950" max="2010" value={form.birthYear} onChange={(event) => updateField('birthYear', parseInt(event.target.value, 10) || '')} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Стать <span className="optional">(необов'язково)</span></label>
                        <select className="form-input" value={form.gender} onChange={(event) => updateField('gender', event.target.value)}>
                            <option value="">Не вказано</option>
                            <option value="male">Чоловік</option>
                            <option value="female">Жінка</option>
                            <option value="other">Інше</option>
                            <option value="prefer_not_to_say">Не хочу вказувати</option>
                        </select>
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Біографія</label>
                    <textarea className="form-textarea" rows={4} placeholder="Розкажіть про себе..." value={form.bio} onChange={(event) => updateField('bio', event.target.value)} />
                </div>
            </div>

            <div className="card edit-section">
                <h3>Мови</h3>
                <div className="language-chips">
                    {LANGUAGES.map((language) => (
                        <button key={language} className={`language-chip ${form.languages.includes(language) ? 'active' : ''}`} onClick={() => toggleLanguage(language)}>
                            {language}
                        </button>
                    ))}
                </div>
            </div>

            <div className="card edit-section">
                <h3>Соціальні мережі</h3>
                <p className="section-desc">Для YouTube краще підключати канал через розділ «Мої канали», щоб статистика підтягувалась автоматично.</p>
                <div className="social-inputs">
                    {SOCIAL_PLATFORMS.map((platform) => (
                        <div key={platform.key} className="social-card-row">
                            <div className="social-card-head">
                                <span className="social-input-icon">{platform.icon}</span>
                                <span className="social-input-label">{platform.label}</span>
                            </div>
                            <div className="social-card-controls">
                                <input
                                    className="form-input"
                                    placeholder={`Посилання на ${platform.label.toLowerCase()}`}
                                    value={form.socialLinks[platform.key] || ''}
                                    onChange={(event) => updateSocial(platform.key, event.target.value)}
                                />
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleSocialAdd(platform.key)}>
                                    Добавить
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card edit-section">
                <h3>Приватність</h3>
                <p className="section-desc">Оберіть, хто бачить вашу інформацію</p>
                <div className="privacy-grid">
                    {PRIVACY_FIELDS.map((field) => (
                        <div key={field.key} className="privacy-row">
                            <span className="privacy-field-label">{field.label}</span>
                            <select className="privacy-select" value={privacy[field.key] || 'public'} onChange={(event) => updatePrivacy(field.key, event.target.value)}>
                                <option value="public">Всім</option>
                                <option value="verified">Перевіреним</option>
                                <option value="private">Тільки мені</option>
                            </select>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card edit-section gdpr-section">
                <h3>Ваші дані (GDPR)</h3>
                <div className="gdpr-actions">
                    <button className="btn btn-secondary" onClick={handleExportData}>
                        Завантажити мої дані
                    </button>
                    <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)}>
                        Видалити акаунт
                    </button>
                </div>
            </div>

            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content" onClick={(event) => event.stopPropagation()}>
                        <h3>Видалення акаунту</h3>
                        <p className="delete-warning">
                            Цю дію неможливо скасувати. Ваші дані будуть анонімізовані, а канали видалені з платформи.
                        </p>
                        <p className="delete-confirm-label">
                            Введіть <strong>ВИДАЛИТИ</strong> для підтвердження:
                        </p>
                        <input className="form-input" value={deleteConfirm} onChange={(event) => setDeleteConfirm(event.target.value)} placeholder="ВИДАЛИТИ" />
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                                Скасувати
                            </button>
                            <button className="btn btn-danger" onClick={handleDeleteAccount} disabled={deleteConfirm !== 'ВИДАЛИТИ'}>
                                Видалити назавжди
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

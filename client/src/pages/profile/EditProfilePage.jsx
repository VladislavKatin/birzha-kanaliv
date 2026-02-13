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
        displayName: '', bio: '', location: '', languages: [],
        birthYear: '', gender: '', professionalRole: '', companyName: '', website: '',
        socialLinks: {},
    });
    const [privacy, setPrivacy] = useState({});
    const [saving, setSaving] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState('');

    useEffect(() => {
        if (dbUser) {
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
            setAvatarPreview(dbUser.photoURL);
        }
    }, [dbUser]);

    function updateField(key, value) {
        setForm(prev => ({ ...prev, [key]: value }));
    }

    function toggleLanguage(lang) {
        setForm(prev => ({
            ...prev,
            languages: prev.languages.includes(lang)
                ? prev.languages.filter(l => l !== lang)
                : [...prev.languages, lang],
        }));
    }

    function updateSocial(platform, value) {
        setForm(prev => ({
            ...prev,
            socialLinks: { ...prev.socialLinks, [platform]: value },
        }));
    }

    function updatePrivacy(field, value) {
        setPrivacy(prev => ({ ...prev, [field]: value }));
    }

    async function handleAvatarChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Максимальний розмір файлу: 2MB');
            return;
        }
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const base64 = ev.target.result;
            setAvatarPreview(base64);
            try {
                await api.post('/profile/avatar', { avatar: base64 });
                toast.success('Аватар оновлено');
            } catch (error) {
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
        } catch (error) {
            toast.error('Не вдалося зберегти');
        } finally {
            setSaving(false);
        }
    }

    async function handleExportData() {
        try {
            const res = await api.get('/gdpr/export');
            const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'my-data-export.json';
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Дані завантажено');
        } catch (error) {
            toast.error('Не вдалося експортувати дані');
        }
    }

    async function handleDeleteAccount() {
        if (deleteConfirm !== 'ВИДАЛИТИ') return;
        try {
            await api.delete('/gdpr/account', { data: { confirmation: 'DELETE_MY_ACCOUNT' } });
            toast.success('Акаунт видалено');
            navigate('/auth');
        } catch (error) {
            toast.error('Не вдалося видалити акаунт');
        }
    }

    return (
        <div className="edit-profile-page">
            <div className="edit-profile-header">
                <h1>Редагування профілю</h1>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Збереження...' : '💾 Зберегти'}
                </button>
            </div>

            {/* Avatar */}
            <div className="card edit-section">
                <h3>Аватар</h3>
                <div className="avatar-upload">
                    <img
                        src={avatarPreview || `https://ui-avatars.com/api/?name=${form.displayName || 'U'}&background=4f46e5&color=fff&size=100`}
                        alt=""
                        className="avatar-preview"
                    />
                    <label className="btn btn-secondary btn-sm avatar-btn">
                        📷 Змінити фото
                        <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
                    </label>
                </div>
            </div>

            {/* Basic Info */}
            <div className="card edit-section">
                <h3>Основна інформація</h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Ім'я</label>
                        <input className="form-input" value={form.displayName} onChange={e => updateField('displayName', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Локація</label>
                        <input className="form-input" placeholder="Київ, Україна" value={form.location} onChange={e => updateField('location', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Роль</label>
                        <input className="form-input" placeholder="Content Creator" value={form.professionalRole} onChange={e => updateField('professionalRole', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Компанія <span className="optional">(необов'язково)</span></label>
                        <input className="form-input" value={form.companyName} onChange={e => updateField('companyName', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Вебсайт</label>
                        <input className="form-input" type="url" placeholder="https://" value={form.website} onChange={e => updateField('website', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Рік народження <span className="optional">(необов'язково)</span></label>
                        <input className="form-input" type="number" min="1950" max="2010" value={form.birthYear} onChange={e => updateField('birthYear', parseInt(e.target.value) || '')} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Стать <span className="optional">(необов'язково)</span></label>
                        <select className="form-input" value={form.gender} onChange={e => updateField('gender', e.target.value)}>
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
                    <textarea className="form-textarea" rows={4} placeholder="Розкажіть про себе..." value={form.bio} onChange={e => updateField('bio', e.target.value)} />
                </div>
            </div>

            {/* Languages */}
            <div className="card edit-section">
                <h3>Мови</h3>
                <div className="language-chips">
                    {LANGUAGES.map(lang => (
                        <button
                            key={lang}
                            className={`language-chip ${form.languages.includes(lang) ? 'active' : ''}`}
                            onClick={() => toggleLanguage(lang)}
                        >
                            {lang}
                        </button>
                    ))}
                </div>
            </div>

            {/* Social Links */}
            <div className="card edit-section">
                <h3>Соціальні мережі</h3>
                <div className="social-inputs">
                    {SOCIAL_PLATFORMS.map(sp => (
                        <div key={sp.key} className="social-input-row">
                            <span className="social-input-icon">{sp.icon}</span>
                            <span className="social-input-label">{sp.label}</span>
                            <input
                                className="form-input"
                                placeholder={`Посилання на ${sp.label.toLowerCase()}`}
                                value={form.socialLinks[sp.key] || ''}
                                onChange={e => updateSocial(sp.key, e.target.value)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Privacy Settings */}
            <div className="card edit-section">
                <h3>Приватність</h3>
                <p className="section-desc">Оберіть, хто бачить вашу інформацію</p>
                <div className="privacy-grid">
                    {PRIVACY_FIELDS.map(field => (
                        <div key={field.key} className="privacy-row">
                            <span className="privacy-field-label">{field.label}</span>
                            <select
                                className="privacy-select"
                                value={privacy[field.key] || 'public'}
                                onChange={e => updatePrivacy(field.key, e.target.value)}
                            >
                                <option value="public">🌍 Всім</option>
                                <option value="verified">✅ Перевіреним</option>
                                <option value="private">🔒 Тільки мені</option>
                            </select>
                        </div>
                    ))}
                </div>
            </div>

            {/* GDPR */}
            <div className="card edit-section gdpr-section">
                <h3>Ваші дані (GDPR)</h3>
                <div className="gdpr-actions">
                    <button className="btn btn-secondary" onClick={handleExportData}>
                        📦 Завантажити мої дані
                    </button>
                    <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)}>
                        🗑️ Видалити акаунт
                    </button>
                </div>
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>⚠️ Видалення акаунту</h3>
                        <p className="delete-warning">Цю дію неможливо скасувати. Ваші дані будуть анонімізовані, а канали видалені з платформи.</p>
                        <p className="delete-confirm-label">Введіть <strong>ВИДАЛИТИ</strong> для підтвердження:</p>
                        <input
                            className="form-input"
                            value={deleteConfirm}
                            onChange={e => setDeleteConfirm(e.target.value)}
                            placeholder="ВИДАЛИТИ"
                        />
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Скасувати</button>
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

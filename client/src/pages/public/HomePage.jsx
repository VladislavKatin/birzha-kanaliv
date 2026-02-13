import { useNavigate } from 'react-router-dom';
import PublicLayout from '../../components/layout/PublicLayout';
import { buildAuthRedirectPath } from '../../services/navigation';
import './HomePage.css';

const steps = [
    {
        num: '01',
        icon: '🔐',
        title: 'Реєстрація',
        desc: 'Увійдіть через Google та підключіть свій YouTube-канал за 30 секунд.',
    },
    {
        num: '02',
        icon: '📢',
        title: 'Створіть пропозицію',
        desc: 'Вкажіть тип обміну, нішу та бажану аудиторію для партнерства.',
    },
    {
        num: '03',
        icon: '🤝',
        title: 'Знайдіть партнера',
        desc: 'Переглядайте пропозиції та обирайте найкращих партнерів для обміну.',
    },
    {
        num: '04',
        icon: '📈',
        title: 'Зростайте разом',
        desc: 'Обмінюйтесь трафіком, залишайте відгуки та зростайте в рейтингу.',
    },
];

const features = [
    {
        icon: '🛡️',
        title: 'Верифікація каналів',
        desc: 'Кожен канал проходить перевірку через YouTube API — ніяких фейків.',
    },
    {
        icon: '📊',
        title: 'Прозора аналітика',
        desc: 'Детальна статистика каналу: підписники, перегляди, темп росту.',
    },
    {
        icon: '⭐',
        title: 'Рейтинг та відгуки',
        desc: 'Система довіри на основі реальних обмінів та відгуків партнерів.',
    },
    {
        icon: '🔄',
        title: 'Безпечний обмін',
        desc: 'Підтвердження обома сторонами. Антифрод та захист від зловживань.',
    },
    {
        icon: '💬',
        title: 'Вбудований чат',
        desc: 'Спілкуйтесь з партнерами без виходу з платформи.',
    },
    {
        icon: '🌐',
        title: 'Мультимовність',
        desc: 'Знаходьте партнерів зі своєї мовної ніші або відкрийте нові ринки.',
    },
];

const stats = [
    { value: '500+', label: 'Каналів' },
    { value: '1 200+', label: 'Обмінів' },
    { value: '4.8', label: 'Середній рейтинг' },
    { value: '15+', label: 'Ніш' },
];

export default function HomePage() {
    const navigate = useNavigate();

    return (
        <PublicLayout>
            <div className="home-page">
                {/* ── Hero ────────────────────────────── */}
                <section className="hero">
                    <div className="hero-inner">
                        <div className="hero-badge">✨ Платформа для YouTube-креаторів</div>
                        <h1 className="hero-title">
                            Безпечний обмін
                            <span className="hero-gradient"> аудиторією </span>
                            між YouTube-каналами
                        </h1>
                        <p className="hero-subtitle">
                            Знаходьте партнерів для взаємного просування. Ростіть канал
                            органічно, без ботів та накруток.
                        </p>
                        <div className="hero-actions">
                            <button className="hero-btn primary" onClick={() => navigate('/auth')}>
                                Почати безкоштовно
                            </button>
                            <button className="hero-btn secondary" onClick={() => navigate(buildAuthRedirectPath('/offers'))}>
                                Переглянути пропозиції
                            </button>
                        </div>
                    </div>
                    <div className="hero-decoration" aria-hidden="true">
                        <div className="hero-blob blob-1" />
                        <div className="hero-blob blob-2" />
                        <div className="hero-blob blob-3" />
                    </div>
                </section>

                {/* ── Stats ───────────────────────────── */}
                <section className="stats-section">
                    <div className="stats-inner">
                        {stats.map((s) => (
                            <div key={s.label} className="stats-item">
                                <span className="stats-value">{s.value}</span>
                                <span className="stats-label">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── How It Works ─────────────────────── */}
                <section className="steps-section">
                    <div className="section-inner">
                        <h2 className="section-title">Як це працює</h2>
                        <p className="section-subtitle">Від реєстрації до першого обміну — 4 прості кроки</p>
                        <div className="steps-grid">
                            {steps.map((step) => (
                                <div key={step.num} className="step-card">
                                    <div className="step-num">{step.num}</div>
                                    <div className="step-icon">{step.icon}</div>
                                    <h3 className="step-title">{step.title}</h3>
                                    <p className="step-desc">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Features ─────────────────────────── */}
                <section className="features-section">
                    <div className="section-inner">
                        <h2 className="section-title">Чому обирають нас</h2>
                        <p className="section-subtitle">Все необхідне для безпечного та ефективного обміну аудиторією</p>
                        <div className="features-grid">
                            {features.map((f) => (
                                <div key={f.title} className="feature-card">
                                    <div className="feature-icon">{f.icon}</div>
                                    <h3 className="feature-title">{f.title}</h3>
                                    <p className="feature-desc">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA ──────────────────────────────── */}
                <section className="cta-section">
                    <div className="cta-inner">
                        <h2 className="cta-title">Готові зростати?</h2>
                        <p className="cta-subtitle">
                            Приєднуйтесь до спільноти креаторів та знайдіть свого ідеального партнера для обміну
                        </p>
                        <button className="hero-btn primary" onClick={() => navigate('/auth')}>
                            Зареєструватися безкоштовно
                        </button>
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}

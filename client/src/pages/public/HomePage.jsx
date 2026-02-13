import { useNavigate } from 'react-router-dom';
import PublicLayout from '../../components/layout/PublicLayout';
import { getLandingCtaPaths, getLandingMetricsSummary } from '../../services/homeLanding';
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
        icon: '📣',
        title: 'Створіть пропозицію',
        desc: 'Вкажіть тип обміну, нішу та вимоги до партнера.',
    },
    {
        num: '03',
        icon: '🤝',
        title: 'Знайдіть партнера',
        desc: 'Переглядайте релевантні пропозиції та надсилайте запити.',
    },
    {
        num: '04',
        icon: '📈',
        title: 'Зростайте разом',
        desc: 'Підтверджуйте обмін, залишайте відгуки, підвищуйте trust score.',
    },
];

const features = [
    {
        icon: '🛡️',
        title: 'Верифікація каналів',
        desc: 'Кожен канал проходить перевірку через YouTube API.',
    },
    {
        icon: '📊',
        title: 'Прозора аналітика',
        desc: 'Підписники, перегляди, динаміка зростання та історія активності.',
    },
    {
        icon: '⭐',
        title: 'Рейтинг та відгуки',
        desc: 'Репутація на базі завершених обмінів та публічних оцінок.',
    },
    {
        icon: '🔄',
        title: 'Безпечний процес',
        desc: 'Обмін завершується лише після підтвердження двох сторін.',
    },
    {
        icon: '💬',
        title: 'Вбудований чат',
        desc: 'Обговорюйте деталі партнерства без переходів у сторонні месенджери.',
    },
    {
        icon: '🌍',
        title: 'Глобальна нішева мережа',
        desc: 'Працюйте з партнерами вашої мови й тематики або відкривайте нові ринки.',
    },
];

const stats = [
    { value: '500+', label: 'Каналів' },
    { value: '1 200+', label: 'Обмінів' },
    { value: '4.8', label: 'Середній рейтинг' },
    { value: '15+', label: 'Ніш' },
];

const personas = [
    {
        title: 'Для авторів-початківців',
        desc: 'Перші партнерства, швидкий social proof та безпечні обміни без накруток.',
    },
    {
        title: 'Для команд та студій',
        desc: 'Системна робота з кількома каналами та прозорий контроль активних swap flow.',
    },
    {
        title: 'Для експертних медіа',
        desc: 'Нішеві колаборації з фокусом на якість аудиторії, а не просто на охоплення.',
    },
];

const faq = [
    {
        q: 'Це безпечно для каналу?',
        a: 'Так. Ви працюєте лише з верифікованими каналами, а завершення обміну контролюється обома сторонами.',
    },
    {
        q: 'Чи можна працювати з кількома каналами?',
        a: 'Так. Платформа підтримує multi-channel сценарій: ви можете вибирати конкретний канал для кожної дії.',
    },
    {
        q: 'Коли зʼявляються відгуки?',
        a: 'Відгуки публікуються із затримкою. Непубліковані відгуки не відображаються у публічних профілях.',
    },
];

const trustSignals = [
    'Verified via YouTube API',
    'Realtime chat + notifications',
    'Delayed public reviews',
    'Safe two-side confirmation',
];

const outcomes = [
    {
        metric: '3x',
        label: 'швидше знаходять релевантний канал-партнер',
    },
    {
        metric: '94%',
        label: 'угод доходять до взаємного підтвердження',
    },
    {
        metric: '< 2 хв',
        label: 'на створення нової пропозиції',
    },
];

export default function HomePage() {
    const navigate = useNavigate();
    const { authPath, offersPath } = getLandingCtaPaths();
    const metricsSummary = getLandingMetricsSummary({
        stats,
        steps,
        features,
        faq,
    });

    return (
        <PublicLayout>
            <div className="home-page">
                <section className="hero">
                    <div className="hero-grid section-inner">
                        <div className="hero-copy">
                            <div className="hero-badge">Платформа для YouTube-креаторів</div>
                            <h1 className="hero-title">
                                Біржа обмінів
                                <span className="hero-gradient"> якісною аудиторією </span>
                                між каналами
                            </h1>
                            <p className="hero-subtitle">
                                Знаходьте перевірених партнерів, керуйте угодами в одному інтерфейсі та масштабуйте канал органічно.
                            </p>
                            <div className="hero-actions">
                                <button className="hero-btn primary" onClick={() => navigate(authPath)}>
                                    Почати безкоштовно
                                </button>
                                <button className="hero-btn secondary" onClick={() => navigate(offersPath)}>
                                    Переглянути пропозиції
                                </button>
                            </div>
                            <ul className="hero-trust-list">
                                {trustSignals.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="hero-panel card" aria-label="Platform highlights">
                            <h3>Що всередині платформи</h3>
                            <ul>
                                <li>Smart matching за нішею та мовою</li>
                                <li>Прозорий swap lifecycle</li>
                                <li>Realtime-чат та сповіщення</li>
                                <li>Trust score і delayed reviews</li>
                            </ul>
                            <div className="hero-panel-metric">
                                <strong>+27%</strong>
                                <span>середнє зростання охоплень за 30 днів для активних користувачів</span>
                            </div>
                            <div className="hero-panel-divider" />
                            <div className="hero-panel-outcomes">
                                {outcomes.map((item) => (
                                    <div key={item.label} className="hero-outcome">
                                        <strong>{item.metric}</strong>
                                        <span>{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="hero-decoration" aria-hidden="true">
                        <div className="hero-blob blob-1" />
                        <div className="hero-blob blob-2" />
                        <div className="hero-blob blob-3" />
                    </div>
                </section>

                <section className="social-proof-section" data-metric-groups={metricsSummary.statCount}>
                    <div className="section-inner">
                        <p className="social-proof-title">Платформі довіряють креатори у нішах:</p>
                        <div className="social-proof-tags">
                            <span>Education</span>
                            <span>Gaming</span>
                            <span>Tech</span>
                            <span>Lifestyle</span>
                            <span>Business</span>
                            <span>Entertainment</span>
                        </div>
                    </div>
                </section>

                <section className="stats-section">
                    <div className="stats-inner section-inner">
                        {stats.map((item) => (
                            <div key={item.label} className="stats-item">
                                <span className="stats-value">{item.value}</span>
                                <span className="stats-label">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="personas-section">
                    <div className="section-inner">
                        <h2 className="section-title">Кому підходить</h2>
                        <p className="section-subtitle">Сценарії використання для різних типів команд</p>
                        <div className="personas-grid">
                            {personas.map((item) => (
                                <article key={item.title} className="persona-card">
                                    <h3>{item.title}</h3>
                                    <p>{item.desc}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="steps-section">
                    <div className="section-inner">
                        <h2 className="section-title">Як це працює</h2>
                        <p className="section-subtitle">Від реєстрації до першого обміну за 4 кроки</p>
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

                <section className="features-section">
                    <div className="section-inner">
                        <h2 className="section-title">Чому обирають нас</h2>
                        <p className="section-subtitle">Інструменти, які закривають повний цикл партнерства</p>
                        <div className="features-grid">
                            {features.map((feature) => (
                                <div key={feature.title} className="feature-card">
                                    <div className="feature-icon">{feature.icon}</div>
                                    <h3 className="feature-title">{feature.title}</h3>
                                    <p className="feature-desc">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="compare-section">
                    <div className="section-inner compare-wrap">
                        <div className="compare-col">
                            <h3>Без платформи</h3>
                            <ul>
                                <li>Ручний пошук партнерів у чатах</li>
                                <li>Немає перевірки якості аудиторії</li>
                                <li>Втрата контексту по угодах</li>
                            </ul>
                        </div>
                        <div className="compare-col better">
                            <h3>З Біржею Каналів</h3>
                            <ul>
                                <li>Каталог релевантних пропозицій</li>
                                <li>Прозорі метрики та рейтинг довіри</li>
                                <li>Керований lifecycle від запиту до review</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="faq-section">
                    <div className="section-inner">
                        <h2 className="section-title">Поширені питання</h2>
                        <div className="faq-list">
                            {faq.map((item) => (
                                <details key={item.q} className="faq-item">
                                    <summary>{item.q}</summary>
                                    <p>{item.a}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="cta-section">
                    <div className="cta-inner">
                        <h2 className="cta-title">Готові масштабувати канал?</h2>
                        <p className="cta-subtitle">
                            Підключайте YouTube, публікуйте першу пропозицію та запускайте партнерства вже сьогодні.
                        </p>
                        <div className="cta-actions">
                            <button className="hero-btn primary" onClick={() => navigate(authPath)}>
                                Зареєструватися безкоштовно
                            </button>
                            <button className="hero-btn secondary" onClick={() => navigate(offersPath)}>
                                Подивитись приклади угод
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}

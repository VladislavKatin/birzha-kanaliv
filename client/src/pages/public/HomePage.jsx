import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    BadgeCheck,
    BarChart3,
    CircleHelp,
    Handshake,
    Languages,
    MessageCircleMore,
    RefreshCcw,
    Rocket,
    Search,
    ShieldCheck,
    Sparkles,
    UserRoundPlus,
} from 'lucide-react';
import PublicLayout from '../../components/layout/PublicLayout';
import { getLandingCtaPaths, getLandingMetricsSummary } from '../../services/homeLanding';
import { getBlogArticlesPreview } from '../../services/blogArticles';
import { applyPageSeo, applyJsonLd, buildBlogCollectionJsonLd } from '../../services/seo';
import './HomePage.css';

const steps = [
    {
        num: '01',
        icon: UserRoundPlus,
        title: 'Реєстрація',
        desc: 'Увійдіть через Google та підключіть свій YouTube-канал за 30 секунд.',
    },
    {
        num: '02',
        icon: Rocket,
        title: 'Створіть пропозицію',
        desc: 'Вкажіть формат обміну, нішу, мову та бажані параметри партнера.',
    },
    {
        num: '03',
        icon: Search,
        title: 'Знайдіть партнера',
        desc: 'Система показує релевантні канали, а ви швидко погоджуєте умови.',
    },
    {
        num: '04',
        icon: Handshake,
        title: 'Зростайте разом',
        desc: 'Підтверджуйте обмін та фіксуйте результат із прозорим lifecycle.',
    },
];

const features = [
    {
        icon: ShieldCheck,
        title: 'Верифікація каналів',
        desc: 'Кожен канал перевіряється перед участю в обмінах.',
    },
    {
        icon: BarChart3,
        title: 'Прозора аналітика',
        desc: 'Оцінюйте релевантність партнера за метриками і динамікою.',
    },
    {
        icon: BadgeCheck,
        title: 'Рейтинг довіри',
        desc: 'Репутація формується з історії успішних обмінів.',
    },
    {
        icon: RefreshCcw,
        title: 'Керований процес',
        desc: 'Кожен етап угоди має статус та контроль обох сторін.',
    },
    {
        icon: MessageCircleMore,
        title: 'Вбудований чат',
        desc: 'Усі деталі партнерства в одному вікні без сторонніх месенджерів.',
    },
    {
        icon: Languages,
        title: 'Нішева мережа',
        desc: 'Працюйте з українською аудиторією або виходьте на нові ринки.',
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
        desc: 'Швидкий старт, перші партнерства і стабільний social proof без сірого трафіку.',
    },
    {
        title: 'Для команд та студій',
        desc: 'Керуйте кількома каналами, централізуйте домовленості та контроль прогресу.',
    },
    {
        title: 'Для нішевих медіа',
        desc: 'Фокус на якості аудиторії та довгострокових колабораціях.',
    },
];

const faq = [
    {
        q: 'Це безпечно для каналу?',
        a: 'Так. Ви працюєте з перевіреними учасниками, а угоди мають взаємне підтвердження.',
    },
    {
        q: 'Чи можна працювати з кількома каналами?',
        a: 'Так. Доступний multi-channel сценарій: окремий канал для кожної дії в платформі.',
    },
    {
        q: 'Скільки часу до першого обміну?',
        a: 'Зазвичай першу релевантну угоду знаходять протягом перших 24-72 годин.',
    },
];

const outcomes = [
    {
        metric: '3x',
        label: 'швидше знаходять релевантного партнера',
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
    const location = useLocation();
    const { authPath, offersPath } = getLandingCtaPaths();
    const articles = getBlogArticlesPreview();

    const metricsSummary = getLandingMetricsSummary({
        stats,
        steps,
        features,
        faq,
    });

    useEffect(() => {
        applyPageSeo({
            title: 'Біржа Каналів - Біржа YouTube-обмінів для українських креаторів',
            description: 'Біржа Каналів допомагає YouTube-креаторам знаходити надійних партнерів, запускати обміни та масштабувати канал органічно.',
            keywords: [
                'YouTube обмін',
                'колаборації YouTube',
                'просування YouTube каналу',
                'партнерство для креаторів',
                'біржа каналів',
            ],
            path: '/',
            type: 'website',
        });

        applyJsonLd('home-blog-schema', buildBlogCollectionJsonLd(articles));
    }, [articles]);

    useEffect(() => {
        if (!location.hash) {
            return;
        }

        const sectionId = location.hash.replace('#', '');
        const section = document.getElementById(sectionId);

        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [location.hash]);

    return (
        <PublicLayout>
            <div className="home-page">
                <section className="hero" id="hero">
                    <div className="hero-grid section-inner">
                        <div className="hero-copy">
                            <div className="hero-badge">
                                <Sparkles size={14} /> Платформа для YouTube-креаторів
                            </div>
                            <h1 className="hero-title">
                                Обмінюйтеся
                                <span className="hero-gradient"> якісною аудиторією </span>
                                швидко та безпечно
                            </h1>
                            <p className="hero-subtitle">
                                Сучасна біржа партнерств для українських YouTube-каналів: від першого контакту до підтвердженого результату.
                            </p>
                            <div className="hero-actions">
                                <button className="hero-btn primary" onClick={() => navigate(authPath)}>
                                    Почати безкоштовно
                                </button>
                                <button className="hero-btn secondary" onClick={() => navigate(offersPath)}>
                                    Дивитись пропозиції
                                </button>
                            </div>
                        </div>

                        <div className="hero-panel" aria-label="Platform highlights">
                            <h3>Що всередині платформи</h3>
                            <ul>
                                <li>Smart matching за нішею, мовою та форматом</li>
                                <li>Прозорий swap lifecycle по етапах</li>
                                <li>Realtime-чат і миттєві сповіщення</li>
                                <li>Рейтинг довіри та контроль якості угод</li>
                            </ul>
                            <div className="hero-panel-metric">
                                <strong>+27%</strong>
                                <span>середнє зростання охоплення за 30 днів для активних користувачів</span>
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

                <section className="stats-section" id="advantages">
                    <div className="stats-inner section-inner">
                        {stats.map((item) => (
                            <div key={item.label} className="stats-item">
                                <span className="stats-value">{item.value}</span>
                                <span className="stats-label">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="personas-section" id="who-is-for">
                    <div className="section-inner">
                        <h2 className="section-title">Кому підходить</h2>
                        <p className="section-subtitle">Сценарії для різних команд і рівнів досвіду</p>
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

                <section className="steps-section" id="how-it-works">
                    <div className="section-inner">
                        <h2 className="section-title">Як це працює</h2>
                        <p className="section-subtitle">Від реєстрації до першої угоди за 4 кроки</p>
                        <div className="steps-grid">
                            {steps.map((step) => {
                                const Icon = step.icon;

                                return (
                                    <div key={step.num} className="step-card">
                                        <div className="step-num">{step.num}</div>
                                        <div className="step-icon" aria-hidden="true">
                                            <Icon size={22} strokeWidth={2.2} />
                                        </div>
                                        <h3 className="step-title">{step.title}</h3>
                                        <p className="step-desc">{step.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="features-section">
                    <div className="section-inner">
                        <h2 className="section-title">Чому обирають нас</h2>
                        <p className="section-subtitle">Інструменти, які закривають повний цикл партнерства</p>
                        <div className="features-grid">
                            {features.map((feature, index) => {
                                const Icon = feature.icon;

                                return (
                                    <article key={feature.title} className="feature-card">
                                        <div className={`feature-icon tone-${(index % 6) + 1}`} aria-hidden="true">
                                            <Icon size={24} strokeWidth={2.2} />
                                        </div>
                                        <h3 className="feature-title">{feature.title}</h3>
                                        <p className="feature-desc">{feature.desc}</p>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="compare-section">
                    <div className="section-inner compare-wrap">
                        <div className="compare-col">
                            <h3>Без платформи</h3>
                            <ul>
                                <li>Ручний пошук партнерів у десятках чатів</li>
                                <li>Складно оцінити якість аудиторії до угоди</li>
                                <li>Втрата контексту та ризик зриву домовленостей</li>
                            </ul>
                        </div>
                        <div className="compare-col better">
                            <h3>З Біржею Каналів</h3>
                            <ul>
                                <li>Каталог релевантних пропозицій і швидкий відгук</li>
                                <li>Прозорі метрики, рейтинги та історія взаємодії</li>
                                <li>Керований процес від запиту до фінального review</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="blog-section" id="blog">
                    <div className="section-inner">
                        <h2 className="section-title">Блог Біржа Каналів</h2>
                        <p className="section-subtitle">Практичні матеріали для зростання YouTube-каналу в 2026 році</p>
                        <div className="blog-list-action">
                            <button className="hero-btn secondary" onClick={() => navigate('/blog')}>
                                Усі статті
                            </button>
                        </div>
                        <div className="blog-grid">
                            {articles.map((article) => (
                                <article key={article.slug} className="blog-card">
                                    <img src={article.coverImage} alt={article.coverAlt} loading="lazy" />
                                    <div className="blog-card-body">
                                        <div className="blog-card-meta">
                                            <span>{article.publishedAt}</span>
                                            <span>{article.readTime}</span>
                                        </div>
                                        <h3>{article.title}</h3>
                                        <p>{article.excerpt}</p>
                                        <button
                                            className="blog-link"
                                            onClick={() => navigate(`/blog/${article.slug}`)}
                                            aria-label={`Read article ${article.title}`}
                                        >
                                            Читати статтю <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="faq-section" id="faq">
                    <div className="section-inner">
                        <h2 className="section-title">Поширені питання</h2>
                        <div className="faq-list">
                            {faq.map((item) => (
                                <details key={item.q} className="faq-item">
                                    <summary>
                                        <CircleHelp size={16} /> {item.q}
                                    </summary>
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

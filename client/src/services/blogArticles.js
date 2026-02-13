const CORE_BLOCKS = [
    'Стале зростання з\'являється тоді, коли команда креатора працює за повторюваною системою: чітка гіпотеза, чіткий обсяг робіт, вимірюваний KPI та зворотний зв\'язок після публікації. Без такої структури навіть сильний контент дає випадкові піки та нестабільний результат.',
    'Якість рішень зростає, коли команда аналізує не одну метрику марнославства, а зв\'язку KPI: охоплення, утримання, конверсію і якість аудиторії. Це прибирає хибні висновки та підвищує передбачуваність стратегії.',
    'Операційна дисципліна є мультиплікатором росту. Призначені відповідальні, дедлайни, критерії приймання та зафіксований пост-аналіз захищають процес від хаосу і прискорюють навчання у повторних циклах співпраці.',
    'Стратегія масштабується лише тоді, коли експерименти можна порівнювати між собою. Структуровані ітерації дозволяють тестувати формати, хуки, профіль партнера і CTA-логіку з висновками, які повторно використовуються у наступних циклах.',
];

function makeLongSections(topic) {
    return [
        {
            heading: `1. Базова стратегія для теми: ${topic}`,
            paragraphs: [
                `Команди часто переходять до виконання ще до визначення критерію успіху. У темі «${topic}» це створює неоднозначність і конфлікти після релізу, бо сторони трактують результат по-різному.`,
                ...CORE_BLOCKS,
            ],
        },
        {
            heading: `2. Фреймворк виконання у темі: ${topic}`,
            paragraphs: [
                `Якість виконання у темі «${topic}» залежить від синхронізації: обсяг, терміни, ролі та правила приймання мають бути зафіксовані до запуску.`,
                ...CORE_BLOCKS,
            ],
        },
        {
            heading: `3. Аналітика та цикл ітерацій у темі: ${topic}`,
            paragraphs: [
                `Довгостроковий результат у темі «${topic}» визначається швидкістю ітерацій. Команди, які стабільно випускають, вимірюють і коригують, будують прогнозовану динаміку зростання.`,
                ...CORE_BLOCKS,
            ],
        },
    ];
}

const BLOG_ARTICLES = [
    {
        slug: 'youtube-collab-strategy-2026',
        title: 'Стратегія YouTube-колаборацій у 2026: як обирати партнерів без втрати охоплення',
        excerpt: 'Практичний фреймворк відбору партнерів, оцінки сумісності аудиторій та KPI для стабільних обмінів.',
        coverImage: '/images/blog/youtube-collab-strategy-2026.svg',
        coverAlt: 'Ілюстрація дашборда стратегії YouTube-колаборацій у синьо-жовтих кольорах',
        publishedAt: '13 лютого 2026',
        publishedAtIso: '2026-02-13',
        readTime: '9 хв читання',
        tags: ['YouTube', 'Колаборації', 'Зростання'],
        seoTitle: 'Стратегія YouTube-колаборацій 2026: як обирати партнерів для передбачуваного зростання',
        seoDescription: 'Дізнайтесь, як обирати релевантних партнерів, фіксувати KPI та отримувати повторюваний результат від колаборацій.',
        keywords: ['youtube колаборації', 'відбір партнерів youtube', 'стратегія росту каналу'],
        relatedSlugs: ['safe-collaboration-contract-checklist', 'content-calendar-with-analytics-loop', 'youtube-trust-score-and-reviews'],
        chart: {
            title: 'Динаміка результатів колаборацій за шість циклів',
            description: 'Стратегічний відбір партнерів поступово випереджає випадкові домовленості.',
            type: 'line',
            xKey: 'cycle',
            data: [
                { cycle: 'Ц1', random: 4, strategic: 5 },
                { cycle: 'Ц2', random: 5, strategic: 7 },
                { cycle: 'Ц3', random: 4, strategic: 9 },
                { cycle: 'Ц4', random: 6, strategic: 12 },
                { cycle: 'Ц5', random: 5, strategic: 14 },
                { cycle: 'Ц6', random: 6, strategic: 17 },
            ],
            series: [
                { key: 'random', name: 'Випадковий відбір', color: '#94a3b8' },
                { key: 'strategic', name: 'Стратегічний відбір', color: '#005bbb' },
            ],
            insights: ['Після третього циклу розрив помітно зростає.', 'Сумісність аудиторії важливіша за голий розмір каналу.'],
        },
        faq: [
            { q: 'Скільки партнерів тестувати на старті?', a: 'Перший контрольний цикл із 5-7 партнерів зазвичай достатній для валідних висновків.' },
            { q: 'Чи потрібно багато KPI для однієї угоди?', a: 'Краще один головний KPI, а решту метрик використовувати як діагностику.' },
        ],
        sections: makeLongSections('YouTube-колаборації'),
    },
    {
        slug: 'youtube-trust-score-and-reviews',
        title: 'Trust Score і відгуки: як системно будувати репутацію креатора',
        excerpt: 'Модель репутаційних сигналів, яка підвищує якість угод і скорочує час погодження.',
        coverImage: '/images/blog/youtube-trust-score-and-reviews.svg',
        coverAlt: 'Ілюстрація карток trust score та відгуків для YouTube-креаторів',
        publishedAt: '13 лютого 2026',
        publishedAtIso: '2026-02-13',
        readTime: '8 хв читання',
        tags: ['YouTube', 'Репутація', 'Відгуки'],
        seoTitle: 'Trust Score для YouTube-креаторів: репутаційна стратегія, що прискорює угоди',
        seoDescription: 'Розберіться, як trust score і якість відгуків впливають на рішення партнерів та швидкість домовленостей.',
        keywords: ['trust score youtube', 'репутація креатора', 'якість відгуків youtube'],
        relatedSlugs: ['safe-collaboration-contract-checklist', 'youtube-collab-strategy-2026', 'content-calendar-with-analytics-loop'],
        chart: {
            title: 'Швидкість погодження угоди за сегментами trust score',
            description: 'Вищий trust score корелює зі зменшенням часу на узгодження.',
            type: 'bar',
            xKey: 'segment',
            data: [
                { segment: '40-49', approvalHours: 68 },
                { segment: '50-59', approvalHours: 54 },
                { segment: '60-69', approvalHours: 39 },
                { segment: '70-79', approvalHours: 29 },
                { segment: '80-89', approvalHours: 21 },
                { segment: '90+', approvalHours: 14 },
            ],
            series: [{ key: 'approvalHours', name: 'Години до погодження', color: '#ffb703' }],
            insights: ['Сильна репутація прискорює операційний цикл.', 'Найбільший ефект проявляється після рівня 70+.'],
        },
        faq: [
            { q: 'Чи можна швидко підняти trust score?', a: 'Він росте через стабільну якість виконання в серії угод, а не від разових акцій.' },
            { q: 'Що важливіше: кількість чи якість відгуків?', a: 'Якість. Фактичні, деталізовані відгуки сильніше впливають на довіру партнерів.' },
        ],
        sections: makeLongSections('trust score та система відгуків'),
    },
    {
        slug: 'youtube-shorts-to-long-videos-funnel',
        title: 'Воронка YouTube Shorts -> довгі відео: як переводити охоплення у глибокий перегляд',
        excerpt: 'Практична модель, яка зв\'язує Shorts і довгий формат без провалу утримання.',
        coverImage: '/images/blog/youtube-shorts-to-long-videos-funnel.svg',
        coverAlt: 'Схема переходу трафіку з Shorts у довгі YouTube-відео',
        publishedAt: '14 лютого 2026',
        publishedAtIso: '2026-02-14',
        readTime: '11 хв читання',
        tags: ['YouTube', 'Shorts', 'Воронка'],
        seoTitle: 'Воронка YouTube Shorts у long-form: практична стратегія конверсії для креаторів',
        seoDescription: 'Побудуйте Shorts-воронку, яка підвищує перегляд довгих відео, утримання і якість підписника.',
        keywords: ['shorts воронка youtube', 'конверсія shorts у longform', 'watch time стратегія'],
        relatedSlugs: ['content-calendar-with-analytics-loop', 'youtube-collab-strategy-2026', 'cross-promo-youtube-telegram-instagram'],
        chart: {
            title: 'Конверсія Shorts у довгі відео залежно від зрілості воронки',
            description: 'Логіка CTA та тематична безперервність напряму підсилюють перехід.',
            type: 'line',
            xKey: 'stage',
            data: [
                { stage: 'База', ctrToLong: 1.8, avgWatch: 2.6 },
                { stage: 'Сюжетний CTA', ctrToLong: 2.7, avgWatch: 3.4 },
                { stage: 'Серійна архітектура', ctrToLong: 3.8, avgWatch: 4.2 },
                { stage: 'Плейлист-міст', ctrToLong: 4.6, avgWatch: 5.1 },
                { stage: 'Повна система', ctrToLong: 5.4, avgWatch: 6.2 },
            ],
            series: [
                { key: 'ctrToLong', name: 'CTR у long-form (%)', color: '#005bbb' },
                { key: 'avgWatch', name: 'Сер. час перегляду (хв)', color: '#ffd500' },
            ],
            insights: ['Сюжетний CTA працює краще за універсальні заклики.', 'Тематична послідовність є ключовим важелем якості.'],
        },
        faq: [
            { q: 'Скільки Shorts публікувати щотижня?', a: 'Зазвичай достатньо 3-5 Shorts, якщо вони підтримують одну сильну тему long-form.' },
            { q: 'Що міряти в першу чергу?', a: 'Насамперед CTR переходу та якість перегляду цільового довгого відео.' },
        ],
        sections: makeLongSections('воронка Shorts у long-form'),
    },
    {
        slug: 'monetization-cpm-rpm-for-ukraine-2026',
        title: 'CPM, RPM і реальний дохід креатора у 2026: як прогнозувати без ілюзій',
        excerpt: 'Практичний гайд з монетизації: ієрархія метрик, сценарне планування і керовані важелі.',
        coverImage: '/images/blog/monetization-cpm-rpm-for-ukraine-2026.svg',
        coverAlt: 'Фінансовий дашборд YouTube-монетизації з кривими CPM та RPM',
        publishedAt: '14 лютого 2026',
        publishedAtIso: '2026-02-14',
        readTime: '12 хв читання',
        tags: ['Монетизація', 'YouTube', 'Аналітика'],
        seoTitle: 'CPM проти RPM для YouTube-креаторів: практична модель прогнозу доходу',
        seoDescription: 'Зрозумійте різницю між CPM і RPM та оптимізуйте економіку каналу для стабільного росту.',
        keywords: ['cpm rpm youtube', 'прогноз доходу креатора', 'монетизація youtube каналу'],
        relatedSlugs: ['content-calendar-with-analytics-loop', 'youtube-shorts-to-long-videos-funnel', 'cross-promo-youtube-telegram-instagram'],
        chart: {
            title: 'Динаміка CPM та RPM при покращенні якості трафіку',
            description: 'RPM зростає швидше, коли підсилюються утримання та якість джерел.',
            type: 'line',
            xKey: 'month',
            data: [
                { month: 'Січ', cpm: 4.2, rpm: 1.3 },
                { month: 'Лют', cpm: 4.5, rpm: 1.5 },
                { month: 'Бер', cpm: 4.7, rpm: 1.8 },
                { month: 'Кві', cpm: 5.0, rpm: 2.1 },
                { month: 'Тра', cpm: 5.1, rpm: 2.2 },
                { month: 'Чер', cpm: 5.4, rpm: 2.6 },
            ],
            series: [
                { key: 'cpm', name: 'CPM ($)', color: '#94a3b8' },
                { key: 'rpm', name: 'RPM ($)', color: '#005bbb' },
            ],
            insights: ['CPM більше відображає ринок, ніж ефективність каналу.', 'RPM є прямим операційним індикатором якості системи.'],
        },
        faq: [
            { q: 'Чому CPM росте, а дохід стоїть?', a: 'Тому що реальний дохід визначає RPM і частка якісного монетизованого трафіку.' },
            { q: 'Що брати для бюджетного планування?', a: 'Сценарний прогноз із реалістичними припущеннями по RPM для кластерів контенту.' },
        ],
        sections: makeLongSections('монетизація через CPM та RPM'),
    },
    {
        slug: 'safe-collaboration-contract-checklist',
        title: 'Чеклист безпечної колаборації: як захистити час, репутацію і трафік в угодах',
        excerpt: 'Практичний чеклист: обсяг робіт, дедлайни, критерії приймання та якість пост-огляду угоди.',
        coverImage: '/images/blog/safe-collaboration-contract-checklist.svg',
        coverAlt: 'Ілюстрація чеклиста та щита для безпечних YouTube-угод',
        publishedAt: '15 лютого 2026',
        publishedAtIso: '2026-02-15',
        readTime: '10 хв читання',
        tags: ['Колаборації', 'Чеклист', 'Ризики'],
        seoTitle: 'Чеклист безпечної колаборації для креаторів: контроль виконання та ризиків',
        seoDescription: 'Використовуйте чеклист, щоб зменшити ризик зриву угоди, прибрати неоднозначність і підвищити якість завершення.',
        keywords: ['чеклист колаборації', 'ризики угод креатора', 'критерії приймання обміну'],
        relatedSlugs: ['youtube-trust-score-and-reviews', 'youtube-collab-strategy-2026', 'monetization-cpm-rpm-for-ukraine-2026'],
        chart: {
            title: 'Щільність інцидентів за етапами колаборації',
            description: 'Найбільше конфліктів виникає на етапі приймання та завершення угоди.',
            type: 'bar',
            xKey: 'phase',
            data: [
                { phase: 'Підготовка', incidents: 12 },
                { phase: 'Продакшн', incidents: 31 },
                { phase: 'Публікація', incidents: 27 },
                { phase: 'Приймання', incidents: 39 },
                { phase: 'Пост-огляд', incidents: 9 },
            ],
            series: [{ key: 'incidents', name: 'Кількість інцидентів', color: '#ef4444' }],
            insights: ['Критерії приймання є найсильнішим важелем зниження ризиків.', 'Чеклист до старту угоди зменшує конфлікти у фіналі.'],
        },
        faq: [
            { q: 'Чи достатньо внутрішньої угоди на платформі?', a: 'Для невеликих інтеграцій часто так, для великих краще додатково фіксувати юридичні умови.' },
            { q: 'Що робити, якщо одна сторона не виконує умови?', a: 'Опиратися на попередньо зафіксовані етапи, дедлайни та критерії приймання.' },
        ],
        sections: makeLongSections('контроль ризиків у колабораціях'),
    },
    {
        slug: 'content-calendar-with-analytics-loop',
        title: 'Контент-календар з аналітичним циклом: як покращувати релізи щомісяця',
        excerpt: 'Практична модель планування: план, реліз, аналіз, корекція і повтор з вимірюваним результатом.',
        coverImage: '/images/blog/content-calendar-with-analytics-loop.svg',
        coverAlt: 'Дошка контент-календаря, з\'єднана з аналітичним циклом та графіками',
        publishedAt: '15 лютого 2026',
        publishedAtIso: '2026-02-15',
        readTime: '11 хв читання',
        tags: ['Контент', 'Аналітика', 'Зростання'],
        seoTitle: 'YouTube контент-календар з аналітичним циклом: повторювана модель зростання',
        seoDescription: 'Побудуйте систему планування, яка щотижня підсилює результат через вимірювання і корекції.',
        keywords: ['контент календар youtube', 'аналітичний цикл креатора', 'повторюване зростання каналу'],
        relatedSlugs: ['youtube-shorts-to-long-videos-funnel', 'monetization-cpm-rpm-for-ukraine-2026', 'youtube-collab-strategy-2026'],
        chart: {
            title: 'Динаміка метрик за шість циклів оптимізації',
            description: 'Малі покращення на кожній ітерації накопичують значний ефект.',
            type: 'line',
            xKey: 'loop',
            data: [
                { loop: 'І1', ctr: 4.1, retention: 32, views: 12 },
                { loop: 'І2', ctr: 4.5, retention: 35, views: 13 },
                { loop: 'І3', ctr: 4.9, retention: 38, views: 15 },
                { loop: 'І4', ctr: 5.2, retention: 40, views: 17 },
                { loop: 'І5', ctr: 5.6, retention: 43, views: 19 },
                { loop: 'І6', ctr: 6.0, retention: 46, views: 22 },
            ],
            series: [
                { key: 'ctr', name: 'CTR (%)', color: '#005bbb' },
                { key: 'retention', name: 'Утримання (%)', color: '#22c55e' },
                { key: 'views', name: 'Перегляди (тис.)', color: '#ffd500' },
            ],
            insights: ['Регулярність циклів важливіша за хаотичні ривки.', 'Журнал рішень прискорює навчання команди.'],
        },
        faq: [
            { q: 'Як часто оновлювати план?', a: 'Оптимально працюють щотижневі або двотижневі спринти з ретроспективою.' },
            { q: 'Які метрики обов\'язкові?', a: 'Базово достатньо CTR, утримання та переглядів у перший тиждень після релізу.' },
        ],
        sections: makeLongSections('контент-календар та аналітичний цикл'),
    },
    {
        slug: 'cross-promo-youtube-telegram-instagram',
        title: 'Крос-промо без втрати фокусу: YouTube, Telegram та Instagram як єдина система росту',
        excerpt: 'Архітектура дистрибуції з однією темою тижня і трьома адаптаціями формату.',
        coverImage: '/images/blog/cross-promo-youtube-telegram-instagram.svg',
        coverAlt: 'Карта крос-платформеного зростання між YouTube, Telegram та Instagram',
        publishedAt: '16 лютого 2026',
        publishedAtIso: '2026-02-16',
        readTime: '10 хв читання',
        tags: ['Крос-промо', 'YouTube', 'Дистрибуція'],
        seoTitle: 'Крос-промо стратегія для креаторів: YouTube, Telegram і Instagram як одна воронка',
        seoDescription: 'Побудуйте єдину систему дистрибуції контенту без перевантаження команди і втрати фокусу.',
        keywords: ['крос платформна стратегія', 'youtube telegram instagram воронка', 'дистрибуція контенту креатора'],
        relatedSlugs: ['youtube-shorts-to-long-videos-funnel', 'content-calendar-with-analytics-loop', 'monetization-cpm-rpm-for-ukraine-2026'],
        chart: {
            title: 'Внесок каналів дистрибуції у загальний трафік',
            description: 'Зовнішні канали посилюють стартовий імпульс релізу.',
            type: 'bar',
            xKey: 'channel',
            data: [
                { channel: 'YouTube пошук', views: 48 },
                { channel: 'YouTube рекомендації', views: 31 },
                { channel: 'Telegram', views: 11 },
                { channel: 'Instagram', views: 7 },
                { channel: 'Інше', views: 3 },
            ],
            series: [{ key: 'views', name: 'Частка переглядів (%)', color: '#005bbb' }],
            insights: ['Зовнішні канали підсилюють ранні сигнали для алгоритму.', 'Одна сильна тема працює краще за випадковий крос-постинг.'],
        },
        faq: [
            { q: 'Чи треба публікувати однаковий контент всюди?', a: 'Ні. Потрібно зберігати одну ідею, але адаптувати формат під кожен майданчик.' },
            { q: 'Який канал найшвидше дає стартовий трафік?', a: 'У більшості ніш Telegram дає найшвидший перший імпульс переходів.' },
        ],
        sections: makeLongSections('крос-платформна дистрибуція контенту'),
    },
];

export function getBlogArticlesPreview() {
    return BLOG_ARTICLES.map((article) => ({
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt,
        coverImage: article.coverImage,
        coverAlt: article.coverAlt,
        publishedAt: article.publishedAt,
        publishedAtIso: article.publishedAtIso,
        readTime: article.readTime,
        tags: article.tags,
    }));
}

export function getBlogArticleBySlug(slug) {
    return BLOG_ARTICLES.find((article) => article.slug === slug) || null;
}

export function getAllBlogArticles() {
    return BLOG_ARTICLES;
}

export function getRelatedBlogArticles(slug, limit = 3) {
    return BLOG_ARTICLES.filter((article) => article.slug !== slug)
        .slice(0, limit)
        .map((article) => ({
            slug: article.slug,
            title: article.title,
            excerpt: article.excerpt,
            coverImage: article.coverImage,
        }));
}

export function getAllBlogTags() {
    const tags = BLOG_ARTICLES.flatMap((article) => article.tags || []);
    const unique = Array.from(new Set(tags));
    return ['All', ...unique];
}

export function filterBlogArticlesByTag(tag) {
    if (!tag || tag === 'All') {
        return getBlogArticlesPreview();
    }

    return getBlogArticlesPreview().filter((article) => article.tags.includes(tag));
}

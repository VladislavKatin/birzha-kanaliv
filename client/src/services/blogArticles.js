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
    {
        slug: 'youtube-collab-kpi-dashboard-2026',
        title: 'KPI-дашборд для YouTube-обмінів у 2026: що контролювати щотижня',
        excerpt: 'Готова система метрик для обмінів: від першого контакту до фінального підтвердження результату.',
        coverImage: '/images/blog/youtube-collab-kpi-dashboard-2026.svg',
        coverAlt: 'Дашборд ключових KPI для YouTube-колаборацій',
        publishedAt: '17 лютого 2026',
        publishedAtIso: '2026-02-17',
        readTime: '10 хв читання',
        tags: ['YouTube', 'KPI', 'Аналітика'],
        seoTitle: 'KPI-дашборд YouTube-обмінів: практичний контроль результату в 2026 році',
        seoDescription: 'Розберіть набір KPI для керування обмінами каналів: швидкість, якість, завершення і повторні угоди.',
        keywords: ['kpi youtube обмін', 'дашборд колаборацій', 'аналітика обміну аудиторіями'],
        relatedSlugs: ['youtube-collab-strategy-2026', 'content-calendar-with-analytics-loop', 'post-collab-retrospective-framework'],
        chart: {
            title: 'Контрольний KPI-пакет за шість тижнів',
            description: 'Системний контроль підвищує частку завершених угод і знижує затримки.',
            type: 'line',
            xKey: 'week',
            data: [
                { week: 'Т1', completion: 52, delay: 34 },
                { week: 'Т2', completion: 58, delay: 29 },
                { week: 'Т3', completion: 63, delay: 24 },
                { week: 'Т4', completion: 69, delay: 20 },
                { week: 'Т5', completion: 74, delay: 17 },
                { week: 'Т6', completion: 79, delay: 14 },
            ],
            series: [
                { key: 'completion', name: 'Завершення угод (%)', color: '#005bbb' },
                { key: 'delay', name: 'Затримка (год)', color: '#ef4444' },
            ],
            insights: ['Регулярний моніторинг KPI зменшує операційні втрати.', 'Затримки падають уже після другого тижня контролю.'],
        },
        faq: [
            { q: 'Які KPI обовʼязкові на старті?', a: 'Мінімум: час відповіді, частка підтверджених угод, утримання трафіку після інтеграції.' },
            { q: 'Чи потрібен окремий дашборд для кожної ніші?', a: 'База може бути єдиною, але цільові пороги KPI краще адаптувати по нішах.' },
        ],
        sections: makeLongSections('KPI-дашборд YouTube-обмінів'),
    },
    {
        slug: 'niche-matching-for-channel-exchange',
        title: 'Нішевий матчинг для обміну каналами: як знаходити релевантних партнерів швидше',
        excerpt: 'Практика нішевого матчингу: семантика контенту, профіль аудиторії та ризик невідповідності.',
        coverImage: '/images/blog/niche-matching-for-channel-exchange.svg',
        coverAlt: 'Схема нішевого матчингу каналів для обміну аудиторією',
        publishedAt: '17 лютого 2026',
        publishedAtIso: '2026-02-17',
        readTime: '11 хв читання',
        tags: ['Ніша', 'Матчинг', 'YouTube'],
        seoTitle: 'Нішевий матчинг каналів: як підвищити релевантність YouTube-обмінів',
        seoDescription: 'Система відбору партнерів за нішами і поведінкою аудиторії для стабільних обмінів без втрати якості трафіку.',
        keywords: ['нішевий матчинг', 'релевантність партнерів youtube', 'обмін каналами ніша'],
        relatedSlugs: ['youtube-collab-strategy-2026', 'pre-collab-audit-for-youtube-channels', 'cross-promo-youtube-telegram-instagram'],
        chart: {
            title: 'Результат угод за рівнем нішевої сумісності',
            description: 'Чим вища сумісність ніш, тим вищі retention і повторні угоди.',
            type: 'bar',
            xKey: 'fit',
            data: [
                { fit: 'Низька', retention: 21 },
                { fit: 'Середня', retention: 34 },
                { fit: 'Висока', retention: 49 },
                { fit: 'Дуже висока', retention: 57 },
            ],
            series: [{ key: 'retention', name: 'Утримання після обміну (%)', color: '#005bbb' }],
            insights: ['Нішевий fit має прямий вплив на якість трафіку.', 'Висока сумісність збільшує повторні домовленості.'],
        },
        faq: [
            { q: 'Чи достатньо збігу тільки за темою?', a: 'Ні, важливо враховувати ще формат споживання, вік контенту і поведінку аудиторії.' },
            { q: 'Як швидко перевірити нішеву сумісність?', a: 'Оцініть останні 10-15 відео партнера, ключові теги та відгук аудиторії в коментарях.' },
        ],
        sections: makeLongSections('нішевий матчинг каналів для обміну'),
    },
    {
        slug: 'pre-collab-audit-for-youtube-channels',
        title: 'Pre-collab аудит YouTube-каналу: що перевірити перед обміном',
        excerpt: 'Покроковий аудит перед угодою: контент, історія виконання, ризики та технічна готовність.',
        coverImage: '/images/blog/pre-collab-audit-for-youtube-channels.svg',
        coverAlt: 'Чеклист pre-collab аудиту YouTube-каналу перед обміном',
        publishedAt: '18 лютого 2026',
        publishedAtIso: '2026-02-18',
        readTime: '10 хв читання',
        tags: ['Аудит', 'YouTube', 'Колаборації'],
        seoTitle: 'Pre-collab аудит каналу: чеклист перевірки YouTube-партнера перед обміном',
        seoDescription: 'Як провести аудит каналу перед обміном, знизити ризики і підвищити шанс успішної угоди.',
        keywords: ['pre collab аудит', 'перевірка youtube партнера', 'ризики перед обміном'],
        relatedSlugs: ['safe-collaboration-contract-checklist', 'niche-matching-for-channel-exchange', 'anti-spam-quality-filter-for-offers'],
        chart: {
            title: 'Зниження ризику після впровадження pre-collab аудиту',
            description: 'Структурований аудит скорочує частку проблемних угод.',
            type: 'line',
            xKey: 'month',
            data: [
                { month: 'М1', risk: 32, approved: 48 },
                { month: 'М2', risk: 27, approved: 53 },
                { month: 'М3', risk: 23, approved: 58 },
                { month: 'М4', risk: 19, approved: 63 },
                { month: 'М5', risk: 16, approved: 68 },
                { month: 'М6', risk: 13, approved: 72 },
            ],
            series: [
                { key: 'risk', name: 'Проблемні угоди (%)', color: '#ef4444' },
                { key: 'approved', name: 'Схвалені угоди (%)', color: '#005bbb' },
            ],
            insights: ['Аудит до запуску економить час і бюджет на виправлення.', 'Частка схвалених угод росте разом зі стандартизацією перевірки.'],
        },
        faq: [
            { q: 'Скільки часу займає pre-collab аудит?', a: 'Базовий аудит займає 10-20 хвилин, якщо є готовий шаблон перевірки.' },
            { q: 'Що найчастіше пропускають у перевірці?', a: 'Історію дотримання дедлайнів і якість зворотного звʼязку після попередніх угод.' },
        ],
        sections: makeLongSections('pre-collab аудит YouTube-каналу'),
    },
    {
        slug: 'post-collab-retrospective-framework',
        title: 'Post-collab ретроспектива: як перетворити один обмін у систему росту',
        excerpt: 'Фреймворк ретроспективи після угоди: висновки, виправлення і підготовка наступного циклу.',
        coverImage: '/images/blog/post-collab-retrospective-framework.svg',
        coverAlt: 'Ретроспектива після колаборації з метриками та рішеннями',
        publishedAt: '18 лютого 2026',
        publishedAtIso: '2026-02-18',
        readTime: '9 хв читання',
        tags: ['Ретроспектива', 'Аналітика', 'Зростання'],
        seoTitle: 'Post-collab ретроспектива: як масштабувати результат YouTube-обмінів',
        seoDescription: 'Побудуйте системну ретроспективу після обміну, щоб кожна угода покращувала наступну.',
        keywords: ['ретроспектива колаборації', 'аналіз після обміну', 'youtube growth loop'],
        relatedSlugs: ['youtube-collab-kpi-dashboard-2026', 'content-calendar-with-analytics-loop', 'youtube-trust-score-and-reviews'],
        chart: {
            title: 'Приріст ефективності після впровадження ретроспектив',
            description: 'Фіксація висновків після кожної угоди пришвидшує покращення циклу.',
            type: 'line',
            xKey: 'cycle',
            data: [
                { cycle: 'Ц1', score: 54 },
                { cycle: 'Ц2', score: 59 },
                { cycle: 'Ц3', score: 63 },
                { cycle: 'Ц4', score: 68 },
                { cycle: 'Ц5', score: 73 },
                { cycle: 'Ц6', score: 78 },
            ],
            series: [{ key: 'score', name: 'Індекс якості циклу', color: '#005bbb' }],
            insights: ['Ретроспектива формує накопичуваний ефект.', 'Команди швидше усувають повторювані помилки.'],
        },
        faq: [
            { q: 'Коли проводити ретроспективу?', a: 'Найкраще у проміжку 24-72 години після завершення угоди, поки контекст свіжий.' },
            { q: 'Що фіксувати обовʼязково?', a: 'Що спрацювало, що провалилося, які рішення прийнято і хто відповідальний за впровадження.' },
        ],
        sections: makeLongSections('post-collab ретроспектива угод'),
    },
    {
        slug: 'anti-spam-quality-filter-for-offers',
        title: 'Антиспам і фільтр якості пропозицій: як очистити каталог від шуму',
        excerpt: 'Практична модель фільтрації: сигнали якості, ризик-патерни і пріоритизація перевірки.',
        coverImage: '/images/blog/anti-spam-quality-filter-for-offers.svg',
        coverAlt: 'Фільтр якості пропозицій обміну з антиспам-правилами',
        publishedAt: '19 лютого 2026',
        publishedAtIso: '2026-02-19',
        readTime: '10 хв читання',
        tags: ['Модерація', 'Якість', 'Каталог'],
        seoTitle: 'Антиспам-фільтр пропозицій: як підвищити якість каталогу обмінів',
        seoDescription: 'Впровадьте правила антиспаму і якісну модерацію, щоб користувачі бачили лише релевантні пропозиції.',
        keywords: ['антиспам пропозиції', 'фільтр якості каталогу', 'модерація обмінів'],
        relatedSlugs: ['pre-collab-audit-for-youtube-channels', 'safe-collaboration-contract-checklist', 'youtube-trust-score-and-reviews'],
        chart: {
            title: 'Вплив фільтра якості на чистоту каталогу',
            description: 'Після введення антиспам-фільтрів частка шумових оферів зменшується.',
            type: 'bar',
            xKey: 'stage',
            data: [
                { stage: 'До фільтра', spam: 37, quality: 63 },
                { stage: 'Базові правила', spam: 24, quality: 76 },
                { stage: 'Сигнали довіри', spam: 16, quality: 84 },
                { stage: 'Повна модель', spam: 9, quality: 91 },
            ],
            series: [
                { key: 'spam', name: 'Шумові офери (%)', color: '#ef4444' },
                { key: 'quality', name: 'Якісні офери (%)', color: '#005bbb' },
            ],
            insights: ['Модерація на основі сигналів суттєво підвищує корисність каталогу.', 'Чим менше шуму, тим вищий відсоток успішних матчів.'],
        },
        faq: [
            { q: 'Які сигнали спаму найважливіші?', a: 'Повторювані шаблонні тексти, нереалістичні обіцянки та відсутність базової аналітики каналу.' },
            { q: 'Чи достатньо ручної модерації?', a: 'Ручна модерація важлива, але найкраще працює в комбінації з автоматичним фільтром сигналів.' },
        ],
        sections: makeLongSections('антиспам і фільтрація якості пропозицій'),
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
    const source = BLOG_ARTICLES.find((article) => article.slug === slug);
    const sourceTags = new Set(source?.tags || []);
    const sourceDate = source?.publishedAtIso ? new Date(source.publishedAtIso).getTime() : 0;

    return BLOG_ARTICLES
        .filter((article) => article.slug !== slug)
        .map((article) => {
            const sharedTags = (article.tags || []).filter((tag) => sourceTags.has(tag)).length;
            const dateScore = sourceDate && article.publishedAtIso
                ? Math.max(0, 30 - Math.abs(new Date(article.publishedAtIso).getTime() - sourceDate) / (1000 * 60 * 60 * 24))
                : 0;

            return {
                ...article,
                _score: sharedTags * 10 + dateScore,
            };
        })
        .sort((a, b) => b._score - a._score)
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

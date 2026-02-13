const BLOG_ARTICLES = [
    {
        slug: 'youtube-collab-strategy-2026',
        title: 'YouTube Collab Strategy 2026: як обирати партнерів без втрати охоплення',
        excerpt: 'Покрокова методика відбору партнерів для колаборацій: критерії аудиторії, форматів та KPI.',
        coverImage: '/images/blog/youtube-collab-strategy-2026.svg',
        coverAlt: 'Illustration of YouTube collaboration strategy dashboard in blue and yellow',
        publishedAt: '13 лютого 2026',
        publishedAtIso: '2026-02-13',
        readTime: '8 хв читання',
        tags: ['YouTube', 'Collab', 'Growth'],
        seoTitle: 'YouTube Collab Strategy 2026 - як обирати партнерів для росту каналу',
        seoDescription: 'Дізнайтесь, як знаходити релевантні YouTube-колаборації, перевіряти якість аудиторії та отримувати стабільне зростання.',
        keywords: ['youtube collab strategy', 'як рости на youtube', 'партнерство youtube', 'обмін аудиторією'],
        sections: [
            {
                heading: '1. Визначте ціль колаборації до пошуку партнера',
                paragraphs: [
                    'Починайте не з переліку каналів, а з результату: охоплення, підписники, утримання або довіра. Для кожної цілі потрібен різний тип партнера.',
                    'Фіксуйте одну головну метрику на угоду. Якщо їх багато, складно зрозуміти, що реально спрацювало.',
                ],
            },
            {
                heading: '2. Перевіряйте релевантність, а не лише розмір каналу',
                paragraphs: [
                    'Порівнюйте тематику, мову, географію глядача і середню залученість. Канал меншого розміру може дати кращий результат за рахунок точнішого попадання в вашу аудиторію.',
                    'Додайте мінімальний поріг релевантності: схожі формати контенту, стабільність публікацій та взаємний інтерес до тем.',
                ],
            },
            {
                heading: '3. Закладайте прозорий сценарій обміну',
                paragraphs: [
                    'Ще до старту узгодьте дедлайни, формат інтеграції, CTA і критерії успішності. Це прибирає 80% конфліктів на фінальному етапі.',
                    'Після завершення колаборації робіть короткий розбір: що спрацювало, що масштабувати, що змінити у наступній угоді.',
                ],
            },
        ],
    },
    {
        slug: 'youtube-trust-score-and-reviews',
        title: 'Trust Score і відгуки: як збирати репутацію YouTube-каналу системно',
        excerpt: 'Система репутації для креаторів: які сигнали підвищують довіру та допомагають отримувати кращі угоди.',
        coverImage: '/images/blog/youtube-trust-score-and-reviews.svg',
        coverAlt: 'Illustration of trust score and review cards for YouTube creators',
        publishedAt: '13 лютого 2026',
        publishedAtIso: '2026-02-13',
        readTime: '7 хв читання',
        tags: ['Trust score', 'Reviews', 'YouTube'],
        seoTitle: 'Trust Score YouTube - як підвищити репутацію і якість партнерств',
        seoDescription: 'Пояснюємо, як працює trust score, які відгуки реально впливають на угоди та як системно покращувати репутацію каналу.',
        keywords: ['trust score youtube', 'відгуки для youtube каналу', 'репутація креатора', 'youtube партнерства'],
        sections: [
            {
                heading: '1. Репутація зростає через стабільність виконання',
                paragraphs: [
                    'Головний сигнал довіри - не разовий успіх, а повторюваність: дотримання дедлайнів, якісне виконання умов і коректна комунікація.',
                    'Регулярно завершені угоди формують передбачуваний профіль каналу, з яким охочіше працюють інші креатори.',
                ],
            },
            {
                heading: '2. Відгуки мають бути конкретними',
                paragraphs: [
                    'Найцінніші review описують процес: швидкість відповіді, якість виконання, дотримання домовленостей та результат.',
                    'Загальні фрази без контексту слабко впливають на прийняття рішення потенційним партнером.',
                ],
            },
            {
                heading: '3. Використовуйте trust score для відбору угод',
                paragraphs: [
                    'Орієнтуйтесь не тільки на власний score, а й на баланс ризику по кожній новій угоді. Високий trust score партнера економить час на узгодженнях.',
                    'Сильна репутація дозволяє входити в більш якісні колаборації та пришвидшує масштабування каналу.',
                ],
            },
        ],
    },
];

export function getBlogArticlesPreview() {
    return BLOG_ARTICLES.map(article => ({
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
    return BLOG_ARTICLES.find(article => article.slug === slug) || null;
}

export function getAllBlogArticles() {
    return BLOG_ARTICLES;
}

export function getAllBlogTags() {
    const tags = BLOG_ARTICLES.flatMap(article => article.tags || []);
    const unique = Array.from(new Set(tags));
    return ['All', ...unique];
}

export function filterBlogArticlesByTag(tag) {
    if (!tag || tag === 'All') {
        return getBlogArticlesPreview();
    }

    return getBlogArticlesPreview().filter(article => article.tags.includes(tag));
}

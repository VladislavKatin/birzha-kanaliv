import fs from 'node:fs/promises';
import path from 'node:path';
import {
    buildBlogArticleFaqJsonLd,
    buildBlogArticleJsonLd,
    buildBlogCollectionJsonLd,
    buildBreadcrumbJsonLd,
    buildFaqPageJsonLd,
    buildOrganizationJsonLd,
    buildSeoPayload,
    buildWebsiteJsonLd,
} from '../src/services/seo.js';
import {
    getAllBlogArticles,
    getBlogArticlesPreview,
    getBlogArticleBySlug,
} from '../src/services/blogArticles.js';
import { HOME_FEATURED_BLOG_PREVIEWS } from '../src/services/blogFeaturedPreviews.js';

const distDir = path.resolve('dist');
const templatePath = path.join(distDir, 'index.html');
const baseTemplate = await fs.readFile(templatePath, 'utf8');
const blogArticles = getAllBlogArticles();
const blogPreviews = getBlogArticlesPreview();
const buildDate = new Date().toISOString().slice(0, 10);

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
}

function injectHead(baseHtml, { seo, jsonLd = [] }) {
    const tags = [
        `<title>${escapeHtml(seo.title)}</title>`,
        `<meta name="description" content="${escapeAttribute(seo.description)}" />`,
        seo.keywords ? `<meta name="keywords" content="${escapeAttribute(seo.keywords)}" />` : '',
        `<meta name="robots" content="${escapeAttribute(seo.robots)}" />`,
        `<link rel="canonical" href="${escapeAttribute(seo.url)}" />`,
        `<link rel="alternate" hreflang="uk-UA" href="${escapeAttribute(seo.url)}" />`,
        `<link rel="alternate" hreflang="x-default" href="${escapeAttribute(seo.url)}" />`,
        `<meta property="og:title" content="${escapeAttribute(seo.title)}" />`,
        `<meta property="og:description" content="${escapeAttribute(seo.description)}" />`,
        `<meta property="og:type" content="${escapeAttribute(seo.type)}" />`,
        `<meta property="og:url" content="${escapeAttribute(seo.url)}" />`,
        `<meta property="og:image" content="${escapeAttribute(seo.image)}" />`,
        `<meta property="og:image:alt" content="${escapeAttribute(seo.imageAlt)}" />`,
        '<meta property="og:site_name" content="Біржа Каналів" />',
        '<meta property="og:locale" content="uk_UA" />',
        '<meta name="twitter:card" content="summary_large_image" />',
        `<meta name="twitter:title" content="${escapeAttribute(seo.title)}" />`,
        `<meta name="twitter:description" content="${escapeAttribute(seo.description)}" />`,
        `<meta name="twitter:url" content="${escapeAttribute(seo.url)}" />`,
        `<meta name="twitter:image" content="${escapeAttribute(seo.image)}" />`,
        `<meta name="twitter:image:alt" content="${escapeAttribute(seo.imageAlt)}" />`,
        ...jsonLd.map((schema, index) => `<script type="application/ld+json" id="prerender-schema-${index}">${JSON.stringify(schema)}</script>`),
    ].filter(Boolean).join('\n    ');

    const cleanedHtml = baseHtml
        .replace(/<title>[\s\S]*?<\/title>/i, '')
        .replace(/<meta name="description" content="[^"]*"\s*\/?>/i, '');

    return cleanedHtml
        .replace('</head>', `    ${tags}\n  </head>`)
        .replace(
            '<div id="root"></div>',
            '<div id="root"><!--prerender-content--></div>',
        );
}

function withRootContent(html, content) {
    return html.replace('<!--prerender-content-->', content);
}

function articleCard(article) {
    return `
        <article>
            <h2><a href="/blog/${escapeAttribute(article.slug)}">${escapeHtml(article.title)}</a></h2>
            <p>${escapeHtml(article.excerpt)}</p>
        </article>
    `;
}

function renderPageShell({ heading, intro, sections = [], links = [] }) {
    const sectionMarkup = sections.map((section) => `
        <section>
            <h2>${escapeHtml(section.title)}</h2>
            ${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('\n')}
        </section>
    `).join('\n');

    const linksMarkup = links.length > 0
        ? `<nav><ul>${links.map((item) => `<li><a href="${escapeAttribute(item.href)}">${escapeHtml(item.label)}</a></li>`).join('')}</ul></nav>`
        : '';

    return `
        <main style="max-width:960px;margin:0 auto;padding:48px 20px;font-family:Arial,sans-serif;line-height:1.6;color:#102a43;">
            <header>
                <h1>${escapeHtml(heading)}</h1>
                <p>${escapeHtml(intro)}</p>
            </header>
            ${linksMarkup}
            ${sectionMarkup}
        </main>
    `;
}

function renderHomePage() {
    const featured = HOME_FEATURED_BLOG_PREVIEWS.map(articleCard).join('\n');
    return `
        <main style="max-width:1120px;margin:0 auto;padding:48px 20px;font-family:Arial,sans-serif;line-height:1.6;color:#102a43;">
            <section>
                <h1>Біржа Каналів - біржа YouTube-обмінів для українських креаторів</h1>
                <p>Платформа для безпечних колаборацій, пошуку партнерів, керування угодами та органічного росту YouTube-каналу.</p>
                <p><a href="/offers">Перейти до каталогу пропозицій</a> | <a href="/blog">Перейти до блогу</a></p>
            </section>
            <section>
                <h2>Що дає платформа</h2>
                <ul>
                    <li>Пошук релевантних партнерів за нішею, мовою та форматом.</li>
                    <li>Прозорий цикл обміну: заявка, погодження, виконання, відгук.</li>
                    <li>Публічний блог з практичними матеріалами для росту YouTube-каналу.</li>
                </ul>
            </section>
            <section>
                <h2>Рекомендовані статті</h2>
                ${featured}
            </section>
        </main>
    `;
}

function renderBlogListPage() {
    return `
        <main style="max-width:960px;margin:0 auto;padding:48px 20px;font-family:Arial,sans-serif;line-height:1.6;color:#102a43;">
            <header>
                <h1>Блог Біржа Каналів</h1>
                <p>Практичні статті про YouTube-колаборації, монетизацію, trust score, SEO і системний ріст каналу.</p>
            </header>
            ${blogPreviews.map(articleCard).join('\n')}
        </main>
    `;
}

function renderBlogArticlePage(article) {
    const faqMarkup = Array.isArray(article.faq) && article.faq.length > 0
        ? `
            <section>
                <h2>FAQ</h2>
                ${article.faq.map((item) => `
                    <article>
                        <h3>${escapeHtml(item.q)}</h3>
                        <p>${escapeHtml(item.a)}</p>
                    </article>
                `).join('\n')}
            </section>
        `
        : '';

    return `
        <main style="max-width:960px;margin:0 auto;padding:48px 20px;font-family:Arial,sans-serif;line-height:1.7;color:#102a43;">
            <article>
                <header>
                    <p>${escapeHtml(article.publishedAt)} · ${escapeHtml(article.readTime)}</p>
                    <h1>${escapeHtml(article.title)}</h1>
                    <p>${escapeHtml(article.excerpt)}</p>
                    <img src="${escapeAttribute(article.coverImage)}" alt="${escapeAttribute(article.coverAlt)}" style="width:100%;max-width:920px;height:auto;border-radius:16px;" />
                </header>
                ${article.sections.map((section) => `
                    <section>
                        <h2>${escapeHtml(section.heading)}</h2>
                        ${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('\n')}
                    </section>
                `).join('\n')}
                ${faqMarkup}
                <section>
                    <h2>Читайте також</h2>
                    <p><a href="/blog">Повернутися до блогу</a></p>
                </section>
            </article>
        </main>
    `;
}

const staticPages = [
    {
        route: '/',
        seo: buildSeoPayload({
            title: 'Біржа Каналів - Біржа YouTube-обмінів для українських креаторів',
            description: 'Біржа Каналів допомагає YouTube-креаторам знаходити надійних партнерів, запускати обміни та масштабувати канал органічно.',
            keywords: ['YouTube обмін', 'колаборації YouTube', 'просування YouTube каналу', 'партнерство для креаторів', 'біржа каналів'],
            path: '/',
            type: 'website',
        }),
        jsonLd: [
            buildBlogCollectionJsonLd(HOME_FEATURED_BLOG_PREVIEWS),
            buildOrganizationJsonLd(),
            buildWebsiteJsonLd(),
        ],
        render: renderHomePage,
    },
    {
        route: '/blog',
        seo: buildSeoPayload({
            title: 'Блог Біржа Каналів - практичні статті для росту YouTube-каналу',
            description: 'Блог Біржа Каналів: стратегії колаборацій, репутації та системного росту YouTube-каналу у 2026 році.',
            keywords: ['блог youtube', 'просування youtube', 'колаборації youtube', 'trust score youtube'],
            path: '/blog',
            type: 'website',
        }),
        jsonLd: [
            buildBlogCollectionJsonLd(blogPreviews),
            buildBreadcrumbJsonLd([
                { name: 'Головна', path: '/' },
                { name: 'Блог', path: '/blog' },
            ]),
        ],
        render: renderBlogListPage,
    },
    {
        route: '/offers',
        seo: buildSeoPayload({
            title: 'Каталог пропозицій YouTube-обміну | Біржа Каналів',
            description: 'Каталог відкритих пропозицій для YouTube-обміну: пошук партнерів за нішею, мовою та розміром каналу.',
            keywords: ['каталог youtube обмінів', 'пропозиції youtube', 'обмін підписниками', 'обмін переглядами'],
            path: '/offers',
            type: 'website',
        }),
        jsonLd: [
            buildBreadcrumbJsonLd([
                { name: 'Головна', path: '/' },
                { name: 'Каталог пропозицій', path: '/offers' },
            ]),
        ],
        render: () => renderPageShell({
            heading: 'Каталог пропозицій YouTube-обміну',
            intro: 'Переглядайте відкриті пропозиції, фільтруйте партнерів за нішею та знаходьте релевантні канали для безпечного обміну аудиторією.',
            sections: [
                {
                    title: 'Що є в каталозі',
                    paragraphs: [
                        'Публічний каталог показує відкриті пропозиції каналів, які шукають партнерів для обміну підписниками або переглядами.',
                        'Після авторизації ви можете надіслати пропозицію зі свого каналу та продовжити угоду в захищеному workflow платформи.',
                    ],
                },
            ],
            links: [
                { href: '/auth', label: 'Увійти через Google' },
                { href: '/blog', label: 'Читайте блог для креаторів' },
            ],
        }),
    },
    {
        route: '/faq',
        seo: buildSeoPayload({
            title: 'FAQ - Біржа Каналів',
            description: 'Відповіді на поширені питання про біржу YouTube-обмінів, безпеку угод, канали та авторизацію.',
            keywords: ['faq біржа каналів', 'питання та відповіді', 'youtube обмін', 'допомога'],
            path: '/faq',
            type: 'website',
        }),
        jsonLd: [
            buildFaqPageJsonLd([
                { q: 'Це безпечно для каналу?', a: 'Так. Ви працюєте з перевіреними учасниками, а угоди мають взаємне підтвердження.' },
                { q: 'Чи можна працювати з кількома каналами?', a: 'Так. Платформа підтримує сценарій роботи з кількома каналами.' },
                { q: 'Скільки часу до першого обміну?', a: 'Перші релевантні угоди часто знаходять протягом 24-72 годин.' },
            ], '/faq'),
        ],
        render: () => renderPageShell({
            heading: 'FAQ Біржа Каналів',
            intro: 'Короткі відповіді про безпеку, пошук партнерів, авторизацію та процес YouTube-обміну.',
            sections: [
                {
                    title: 'Основні питання',
                    paragraphs: [
                        'Платформа призначена для безпечного та контрольованого обміну аудиторією між YouTube-каналами.',
                        'Авторизація виконується через Google, а дії всередині системи прив’язуються до конкретного користувача та каналу.',
                    ],
                },
            ],
            links: [
                { href: '/help', label: 'Help Center' },
                { href: '/offers', label: 'Каталог пропозицій' },
            ],
        }),
    },
    {
        route: '/help',
        seo: buildSeoPayload({
            title: 'Help Center - Біржа Каналів',
            description: 'Довідковий центр Біржа Каналів: авторизація, підключення каналу, відповіді по угодах та роботі з платформою.',
            keywords: ['help center', 'довідка біржа каналів', 'підтримка youtube обмін'],
            path: '/help',
            type: 'website',
        }),
        jsonLd: [
            buildFaqPageJsonLd([
                { q: 'Як увійти на платформу?', a: 'Увійдіть через Google на сторінці авторизації.' },
                { q: 'Як знайти партнера?', a: 'Використовуйте публічний каталог пропозицій та фільтри за нішею і мовою.' },
                { q: 'Як працює підтвердження обміну?', a: 'Кожна сторона підтверджує виконання у workflow платформи.' },
            ], '/help'),
        ],
        render: () => renderPageShell({
            heading: 'Help Center',
            intro: 'Довідка по авторизації, роботі з каналами, каталогом пропозицій і процесом обміну.',
            sections: [
                {
                    title: 'Початок роботи',
                    paragraphs: [
                        'Спочатку увійдіть через Google, після чого зможете працювати з публічним каталогом та внутрішнім кабінетом.',
                        'Після авторизації доступні створення пропозицій, відповіді на офери, чат та історія угод.',
                    ],
                },
            ],
            links: [
                { href: '/auth', label: 'Увійти' },
                { href: '/faq', label: 'Поширені питання' },
            ],
        }),
    },
    {
        route: '/privacy',
        seo: buildSeoPayload({
            title: 'Privacy Policy - Біржа Каналів',
            description: 'Політика конфіденційності Біржа Каналів: які дані збираються, як вони використовуються та як захищається акаунт користувача.',
            keywords: ['privacy policy', 'політика конфіденційності', 'біржа каналів', 'персональні дані'],
            path: '/privacy',
            type: 'website',
        }),
        jsonLd: [
            buildBreadcrumbJsonLd([
                { name: 'Головна', path: '/' },
                { name: 'Privacy Policy', path: '/privacy' },
            ]),
        ],
        render: () => renderPageShell({
            heading: 'Privacy Policy',
            intro: 'Коротка сторінка про обробку персональних даних, авторизацію та безпеку на Біржа Каналів.',
            sections: [
                {
                    title: 'Персональні дані',
                    paragraphs: [
                        'Платформа використовує дані, необхідні для авторизації, роботи профілю та виконання YouTube-обмінів.',
                        'Для публічних SEO-сторінок ця сторінка описує рамку використання даних і посилання на повний застосунок.',
                    ],
                },
            ],
        }),
    },
    {
        route: '/terms',
        seo: buildSeoPayload({
            title: 'Terms of Service - Біржа Каналів',
            description: 'Умови використання Біржа Каналів: правила роботи з платформою, контентом, каналами та партнерськими взаємодіями.',
            keywords: ['terms of service', 'умови використання', 'біржа каналів', 'правила платформи'],
            path: '/terms',
            type: 'website',
        }),
        jsonLd: [
            buildBreadcrumbJsonLd([
                { name: 'Головна', path: '/' },
                { name: 'Terms of Service', path: '/terms' },
            ]),
        ],
        render: () => renderPageShell({
            heading: 'Terms of Service',
            intro: 'Базові правила використання Біржа Каналів для креаторів, каналів і партнерських взаємодій.',
            sections: [
                {
                    title: 'Правила роботи',
                    paragraphs: [
                        'Користувачі відповідають за достовірність даних акаунта, якість взаємодії та дотримання правил платформи.',
                        'Публічні сторінки надають пошуковим системам зрозумілий опис сервісу та його базових умов використання.',
                    ],
                },
            ],
        }),
    },
];

async function writeRoute(route, html) {
    const normalized = route === '/' ? '' : route.replace(/^\/+|\/+$/g, '');
    const filePath = normalized
        ? path.join(distDir, normalized, 'index.html')
        : path.join(distDir, 'index.html');

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, html, 'utf8');
}

async function writeBlogSitemap() {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${blogArticles.map((article) => `    <url>\n        <loc>https://birzha-kanaliv.biz.ua/blog/${article.slug}</loc>\n        <lastmod>${article.publishedAtIso}</lastmod>\n        <changefreq>monthly</changefreq>\n        <priority>0.7</priority>\n    </url>`).join('\n')}\n</urlset>\n`;
    await fs.writeFile(path.join(distDir, 'sitemap-blog.xml'), xml, 'utf8');
}

async function writePagesSitemap() {
    const pageMeta = [
        { route: '/', changefreq: 'daily', priority: '1.0' },
        { route: '/offers', changefreq: 'hourly', priority: '0.9' },
        { route: '/blog', changefreq: 'daily', priority: '0.8' },
        { route: '/help', changefreq: 'monthly', priority: '0.7' },
        { route: '/faq', changefreq: 'monthly', priority: '0.6' },
        { route: '/privacy', changefreq: 'yearly', priority: '0.3' },
        { route: '/terms', changefreq: 'yearly', priority: '0.3' },
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pageMeta.map((page) => `    <url>\n        <loc>https://birzha-kanaliv.biz.ua${page.route === '/' ? '/' : page.route}</loc>\n        <lastmod>${buildDate}</lastmod>\n        <changefreq>${page.changefreq}</changefreq>\n        <priority>${page.priority}</priority>\n    </url>`).join('\n')}\n</urlset>\n`;
    await fs.writeFile(path.join(distDir, 'sitemap-pages.xml'), xml, 'utf8');
}

async function writeSitemapIndex() {
    const blogLastmod = blogArticles.reduce((latest, article) => (
        article.publishedAtIso > latest ? article.publishedAtIso : latest
    ), buildDate);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n    <sitemap>\n        <loc>https://birzha-kanaliv.biz.ua/sitemap-pages.xml</loc>\n        <lastmod>${buildDate}</lastmod>\n    </sitemap>\n    <sitemap>\n        <loc>https://birzha-kanaliv.biz.ua/sitemap-blog.xml</loc>\n        <lastmod>${blogLastmod}</lastmod>\n    </sitemap>\n</sitemapindex>\n`;
    await fs.writeFile(path.join(distDir, 'sitemap.xml'), xml, 'utf8');
}

for (const page of staticPages) {
    const htmlWithHead = injectHead(baseTemplate, { seo: page.seo, jsonLd: page.jsonLd });
    await writeRoute(page.route, withRootContent(htmlWithHead, page.render()));
}

for (const article of blogArticles) {
    const seo = buildSeoPayload({
        title: article.seoTitle,
        description: article.seoDescription,
        keywords: article.keywords,
        path: `/blog/${article.slug}`,
        image: article.coverImage,
        imageAlt: article.coverAlt,
        type: 'article',
    });

    const htmlWithHead = injectHead(baseTemplate, {
        seo,
        jsonLd: [
            buildBlogArticleJsonLd(article),
            buildBlogArticleFaqJsonLd(article),
            buildBreadcrumbJsonLd([
                { name: 'Головна', path: '/' },
                { name: 'Блог', path: '/blog' },
                { name: article.title, path: `/blog/${article.slug}` },
            ]),
        ].filter(Boolean),
    });

    await writeRoute(`/blog/${article.slug}`, withRootContent(htmlWithHead, renderBlogArticlePage(article)));
}

const blog404 = getBlogArticleBySlug('missing-slug');
if (blog404 !== null) {
    throw new Error('Unexpected blog lookup result while prerendering.');
}

await writeBlogSitemap();
await writePagesSitemap();
await writeSitemapIndex();

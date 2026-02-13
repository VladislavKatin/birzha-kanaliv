const CORE_BLOCKS = [
    'Sustainable growth appears when a creator team follows a repeatable system: clear hypothesis, clear scope, measurable KPI, and a post-release feedback loop. Without this structure, even strong content can create random peaks and unstable outcomes.',
    'Decision quality increases when the team evaluates KPI bundles instead of one vanity metric. Reach, retention, conversion, and audience quality must be reviewed together. This removes false positives and improves strategic consistency.',
    'Operations discipline is a growth multiplier. Explicit ownership, explicit deadlines, acceptance criteria, and documented post-analysis protect the team from chaos and speed up learning across repeated collaboration cycles.',
    'A strategy becomes scalable only when experiments are comparable. Structured iterations allow teams to test hooks, formats, partner profiles, and CTA logic with clear conclusions that can be reused in future cycles.',
];

function makeLongSections(topic) {
    return [
        {
            heading: `1. Strategy baseline for ${topic}`,
            paragraphs: [
                `Teams often move to execution before defining success. In ${topic}, this creates ambiguity and post-release conflict because results are interpreted differently by each side.`,
                ...CORE_BLOCKS,
            ],
        },
        {
            heading: `2. Execution framework for ${topic}`,
            paragraphs: [
                `Execution quality in ${topic} depends on alignment: scope, timing, ownership, and acceptance logic must be explicit before launch.`,
                ...CORE_BLOCKS,
            ],
        },
        {
            heading: `3. Analytics and iteration loop for ${topic}`,
            paragraphs: [
                `Long-term performance in ${topic} is driven by iteration speed. Teams that release, measure, and adjust in consistent cycles build predictable growth.`,
                ...CORE_BLOCKS,
            ],
        },
    ];
}

const BLOG_ARTICLES = [
    {
        slug: 'youtube-collab-strategy-2026',
        title: 'YouTube Collab Strategy 2026: how to choose partners without losing reach',
        excerpt: 'A practical framework for partner selection, audience fit, and measurable collaboration KPIs.',
        coverImage: '/images/blog/youtube-collab-strategy-2026.svg',
        coverAlt: 'Illustration of YouTube collaboration strategy dashboard in blue and yellow',
        publishedAt: 'February 13, 2026',
        publishedAtIso: '2026-02-13',
        readTime: '9 min read',
        tags: ['YouTube', 'Collab', 'Growth'],
        seoTitle: 'YouTube Collab Strategy 2026: partner selection framework for predictable growth',
        seoDescription: 'Learn how to select relevant collaboration partners and build repeatable growth outcomes.',
        keywords: ['youtube collab strategy', 'creator partner selection', 'youtube growth framework'],
        relatedSlugs: ['safe-collaboration-contract-checklist', 'content-calendar-with-analytics-loop', 'youtube-trust-score-and-reviews'],
        chart: {
            title: 'Collaboration result trend across six cycles',
            description: 'Strategic partner selection outperforms random deal selection over time.',
            type: 'line',
            xKey: 'cycle',
            data: [
                { cycle: 'C1', random: 4, strategic: 5 },
                { cycle: 'C2', random: 5, strategic: 7 },
                { cycle: 'C3', random: 4, strategic: 9 },
                { cycle: 'C4', random: 6, strategic: 12 },
                { cycle: 'C5', random: 5, strategic: 14 },
                { cycle: 'C6', random: 6, strategic: 17 },
            ],
            series: [
                { key: 'random', name: 'Random partner pick', color: '#94a3b8' },
                { key: 'strategic', name: 'Strategic partner pick', color: '#005bbb' },
            ],
            insights: ['The gap widens after cycle three.', 'Audience compatibility is stronger than channel size alone.'],
        },
        faq: [
            { q: 'How many partners should we test first?', a: 'Five to seven is enough for an initial benchmark cycle.' },
            { q: 'Should one deal have many KPIs?', a: 'Use one primary KPI and keep other metrics diagnostic.' },
        ],
        sections: makeLongSections('YouTube collaboration strategy'),
    },
    {
        slug: 'youtube-trust-score-and-reviews',
        title: 'Trust Score and reviews: how to build creator reputation as a system',
        excerpt: 'A practical model of reputation signals that improve deal quality and reduce negotiation friction.',
        coverImage: '/images/blog/youtube-trust-score-and-reviews.svg',
        coverAlt: 'Illustration of trust score and review cards for YouTube creators',
        publishedAt: 'February 13, 2026',
        publishedAtIso: '2026-02-13',
        readTime: '8 min read',
        tags: ['Trust score', 'Reviews', 'YouTube'],
        seoTitle: 'Trust Score for YouTube creators: reputation strategy that improves deal quality',
        seoDescription: 'Understand how trust score and review quality influence partner decisions and deal speed.',
        keywords: ['trust score youtube', 'creator reputation', 'youtube review quality'],
        relatedSlugs: ['safe-collaboration-contract-checklist', 'youtube-collab-strategy-2026', 'content-calendar-with-analytics-loop'],
        chart: {
            title: 'Deal approval speed by trust score segment',
            description: 'Higher trust score correlates with lower negotiation time.',
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
            series: [{ key: 'approvalHours', name: 'Hours to approval', color: '#ffb703' }],
            insights: ['Reputation accelerates process throughput.', 'The largest shift appears after score 70.'],
        },
        faq: [
            { q: 'Can trust score be improved quickly?', a: 'It improves through consistent execution quality over repeated deals.' },
            { q: 'What matters more, count or quality of reviews?', a: 'Quality. Evidence-based reviews influence partner decisions more.' },
        ],
        sections: makeLongSections('trust score and review quality'),
    },
    {
        slug: 'youtube-shorts-to-long-videos-funnel',
        title: 'YouTube Shorts to Long Video Funnel: how to turn short reach into deep watch time',
        excerpt: 'A practical funnel model connecting Shorts and long-form content without retention collapse.',
        coverImage: '/images/blog/youtube-shorts-to-long-videos-funnel.svg',
        coverAlt: 'Diagram showing Shorts traffic flowing into long-form YouTube videos',
        publishedAt: 'February 14, 2026',
        publishedAtIso: '2026-02-14',
        readTime: '11 min read',
        tags: ['YouTube', 'Shorts', 'Funnel'],
        seoTitle: 'YouTube Shorts to long-form funnel: practical conversion strategy for creators',
        seoDescription: 'Build a Shorts funnel that increases long-form watch time and subscription quality.',
        keywords: ['shorts funnel youtube', 'short to long conversion', 'youtube watch time strategy'],
        relatedSlugs: ['content-calendar-with-analytics-loop', 'youtube-collab-strategy-2026', 'cross-promo-youtube-telegram-instagram'],
        chart: {
            title: 'Shorts to long-form conversion by funnel maturity',
            description: 'CTA logic and topic continuity improve transition quality.',
            type: 'line',
            xKey: 'stage',
            data: [
                { stage: 'Baseline', ctrToLong: 1.8, avgWatch: 2.6 },
                { stage: 'Narrative CTA', ctrToLong: 2.7, avgWatch: 3.4 },
                { stage: 'Series architecture', ctrToLong: 3.8, avgWatch: 4.2 },
                { stage: 'Playlist bridge', ctrToLong: 4.6, avgWatch: 5.1 },
                { stage: 'Full system', ctrToLong: 5.4, avgWatch: 6.2 },
            ],
            series: [
                { key: 'ctrToLong', name: 'CTR to long-form (%)', color: '#005bbb' },
                { key: 'avgWatch', name: 'Avg watch time (min)', color: '#ffd500' },
            ],
            insights: ['Narrative CTA beats generic prompts.', 'Topic continuity is a primary quality lever.'],
        },
        faq: [
            { q: 'How many Shorts should we publish weekly?', a: 'Three to five Shorts are enough if they support one coherent long-form theme.' },
            { q: 'What should be measured first?', a: 'Transition CTR and watch quality on long-form destination videos.' },
        ],
        sections: makeLongSections('Shorts to long-form funnel design'),
    },
    {
        slug: 'monetization-cpm-rpm-for-ukraine-2026',
        title: 'CPM, RPM, and real creator revenue in 2026: how to forecast without illusions',
        excerpt: 'A practical monetization guide: metric hierarchy, scenario forecasting, and execution levers.',
        coverImage: '/images/blog/monetization-cpm-rpm-for-ukraine-2026.svg',
        coverAlt: 'Financial dashboard for YouTube channel monetization with CPM and RPM curves',
        publishedAt: 'February 14, 2026',
        publishedAtIso: '2026-02-14',
        readTime: '12 min read',
        tags: ['Monetization', 'YouTube', 'Analytics'],
        seoTitle: 'CPM vs RPM for YouTube creators: practical revenue forecasting model',
        seoDescription: 'Understand CPM and RPM differences and optimize channel economics for sustainable growth.',
        keywords: ['cpm rpm youtube', 'creator revenue forecast', 'youtube monetization model'],
        relatedSlugs: ['content-calendar-with-analytics-loop', 'youtube-shorts-to-long-videos-funnel', 'cross-promo-youtube-telegram-instagram'],
        chart: {
            title: 'CPM and RPM trend under quality traffic improvements',
            description: 'RPM grows when retention and traffic quality improve.',
            type: 'line',
            xKey: 'month',
            data: [
                { month: 'Jan', cpm: 4.2, rpm: 1.3 },
                { month: 'Feb', cpm: 4.5, rpm: 1.5 },
                { month: 'Mar', cpm: 4.7, rpm: 1.8 },
                { month: 'Apr', cpm: 5.0, rpm: 2.1 },
                { month: 'May', cpm: 5.1, rpm: 2.2 },
                { month: 'Jun', cpm: 5.4, rpm: 2.6 },
            ],
            series: [
                { key: 'cpm', name: 'CPM ($)', color: '#94a3b8' },
                { key: 'rpm', name: 'RPM ($)', color: '#005bbb' },
            ],
            insights: ['CPM is a market signal.', 'RPM is an execution signal for channel operations.'],
        },
        faq: [
            { q: 'Why can CPM rise while revenue stays flat?', a: 'Because channel income depends on RPM and monetized traffic quality.' },
            { q: 'What should be used for budget planning?', a: 'Use scenario forecasting with cluster-level RPM assumptions.' },
        ],
        sections: makeLongSections('CPM and RPM monetization planning'),
    },
    {
        slug: 'safe-collaboration-contract-checklist',
        title: 'Safe collaboration checklist: protect time, reputation, and traffic in creator deals',
        excerpt: 'A practical collaboration checklist covering scope, timing, acceptance rules, and post-deal review quality.',
        coverImage: '/images/blog/safe-collaboration-contract-checklist.svg',
        coverAlt: 'Checklist and shield illustration for safe YouTube collaboration agreements',
        publishedAt: 'February 15, 2026',
        publishedAtIso: '2026-02-15',
        readTime: '10 min read',
        tags: ['Collab', 'Checklist', 'Risk'],
        seoTitle: 'Safe collaboration checklist for creators: execution and risk control framework',
        seoDescription: 'Use this checklist to reduce deal risk, avoid ambiguity, and improve completion quality.',
        keywords: ['safe collaboration checklist', 'creator deal risk', 'collaboration acceptance criteria'],
        relatedSlugs: ['youtube-trust-score-and-reviews', 'youtube-collab-strategy-2026', 'monetization-cpm-rpm-for-ukraine-2026'],
        chart: {
            title: 'Incident density by collaboration stage',
            description: 'Most conflicts happen at acceptance and completion stages.',
            type: 'bar',
            xKey: 'phase',
            data: [
                { phase: 'Preparation', incidents: 12 },
                { phase: 'Production', incidents: 31 },
                { phase: 'Publication', incidents: 27 },
                { phase: 'Acceptance', incidents: 39 },
                { phase: 'Review', incidents: 9 },
            ],
            series: [{ key: 'incidents', name: 'Incident count', color: '#ef4444' }],
            insights: ['Acceptance criteria are the strongest risk-control lever.', 'Checklist alignment reduces end-stage conflict.'],
        },
        faq: [
            { q: 'Is platform-level agreement enough?', a: 'For small deals often yes, for large integrations use explicit external legal terms.' },
            { q: 'What if one side does not deliver?', a: 'Use predefined acceptance criteria and documented milestones as objective anchors.' },
        ],
        sections: makeLongSections('collaboration risk and acceptance control'),
    },
    {
        slug: 'content-calendar-with-analytics-loop',
        title: 'Content calendar with analytics loop: plan releases that improve every month',
        excerpt: 'A practical planning model: plan, release, analyze, adjust, and repeat with measurable outcomes.',
        coverImage: '/images/blog/content-calendar-with-analytics-loop.svg',
        coverAlt: 'Content calendar board connected with analytics loop arrows and charts',
        publishedAt: 'February 15, 2026',
        publishedAtIso: '2026-02-15',
        readTime: '11 min read',
        tags: ['Content', 'Analytics', 'Growth'],
        seoTitle: 'YouTube content calendar with analytics loop: repeatable growth model',
        seoDescription: 'Build a planning system that compounds results through weekly measurement and adjustment.',
        keywords: ['youtube content calendar', 'creator analytics loop', 'repeatable growth model'],
        relatedSlugs: ['youtube-shorts-to-long-videos-funnel', 'monetization-cpm-rpm-for-ukraine-2026', 'youtube-collab-strategy-2026'],
        chart: {
            title: 'Result trend across six optimization loops',
            description: 'Small iterative improvements compound over repeated cycles.',
            type: 'line',
            xKey: 'loop',
            data: [
                { loop: 'L1', ctr: 4.1, retention: 32, views: 12 },
                { loop: 'L2', ctr: 4.5, retention: 35, views: 13 },
                { loop: 'L3', ctr: 4.9, retention: 38, views: 15 },
                { loop: 'L4', ctr: 5.2, retention: 40, views: 17 },
                { loop: 'L5', ctr: 5.6, retention: 43, views: 19 },
                { loop: 'L6', ctr: 6.0, retention: 46, views: 22 },
            ],
            series: [
                { key: 'ctr', name: 'CTR (%)', color: '#005bbb' },
                { key: 'retention', name: 'Retention (%)', color: '#22c55e' },
                { key: 'views', name: 'Views (k)', color: '#ffd500' },
            ],
            insights: ['Loop consistency is more valuable than random hero experiments.', 'Decision logs improve learning speed across teams.'],
        },
        faq: [
            { q: 'How often should the plan be updated?', a: 'Weekly or bi-weekly sprints work well for most teams.' },
            { q: 'What metrics are mandatory?', a: 'CTR, retention, and first-week views are enough for baseline control.' },
        ],
        sections: makeLongSections('content calendar and analytics loop design'),
    },
    {
        slug: 'cross-promo-youtube-telegram-instagram',
        title: 'Cross-promo without focus loss: connect YouTube, Telegram, and Instagram into one growth system',
        excerpt: 'A cross-platform distribution architecture with one weekly theme and three format adaptations.',
        coverImage: '/images/blog/cross-promo-youtube-telegram-instagram.svg',
        coverAlt: 'Cross-platform growth map connecting YouTube, Telegram and Instagram nodes',
        publishedAt: 'February 16, 2026',
        publishedAtIso: '2026-02-16',
        readTime: '10 min read',
        tags: ['Cross-promo', 'YouTube', 'Distribution'],
        seoTitle: 'Cross-promo strategy for creators: YouTube, Telegram, and Instagram as one funnel',
        seoDescription: 'Design one distribution system across YouTube, Telegram, and Instagram without team overload.',
        keywords: ['cross platform creator strategy', 'youtube telegram instagram funnel', 'creator distribution model'],
        relatedSlugs: ['youtube-shorts-to-long-videos-funnel', 'content-calendar-with-analytics-loop', 'monetization-cpm-rpm-for-ukraine-2026'],
        chart: {
            title: 'Traffic contribution by distribution channel',
            description: 'External channels amplify launch momentum and recommendation performance.',
            type: 'bar',
            xKey: 'channel',
            data: [
                { channel: 'YouTube search', views: 48 },
                { channel: 'YouTube recommendations', views: 31 },
                { channel: 'Telegram', views: 11 },
                { channel: 'Instagram', views: 7 },
                { channel: 'Other', views: 3 },
            ],
            series: [{ key: 'views', name: 'Share of views (%)', color: '#005bbb' }],
            insights: ['External channels strengthen early algorithm signals.', 'One narrative topic beats random cross-posting.'],
        },
        faq: [
            { q: 'Should content be reposted identically on every channel?', a: 'No. Keep one strategic message but adapt format for each platform.' },
            { q: 'Which channel is usually fastest for launch traffic?', a: 'Telegram usually brings the fastest first-wave click-through.' },
        ],
        sections: makeLongSections('cross-platform distribution system'),
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

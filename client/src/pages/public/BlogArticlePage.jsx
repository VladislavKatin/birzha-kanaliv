import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import PublicLayout from '../../components/layout/PublicLayout';
import { getBlogArticleBySlug, getRelatedBlogArticles } from '../../services/blogArticles';
import {
    applyJsonLd,
    applyPageSeo,
    buildBlogArticleFaqJsonLd,
    buildBlogArticleJsonLd,
    buildBreadcrumbJsonLd,
} from '../../services/seo';
import './BlogArticlePage.css';

const VISUAL_ARTICLE_SLUGS = new Set([
    'youtube-exchange-pricing-model-2026',
    'how-to-write-offer-description-that-converts',
    'audience-overlap-analysis-for-youtube-exchanges',
    'negotiation-script-for-channel-exchange',
    'channel-brand-safety-checklist-for-collabs',
    'retention-metrics-after-collaboration',
    'subscriber-quality-vs-volume-in-exchanges',
    'youtube-analytics-checklist-before-deal',
    'red-flags-in-channel-exchange-deals',
    'local-ukrainian-youtube-niches-2026',
    'launch-playbook-for-new-channel-on-exchange',
    'how-to-scale-to-10-exchanges-per-month',
    'conversion-optimization-for-offer-page',
    'case-study-education-channel-growth-exchange',
    'case-study-gaming-channel-growth-exchange',
    'case-study-business-channel-growth-exchange',
    'communication-sla-for-youtube-collab-teams',
    'multi-channel-portfolio-strategy-for-creators',
    'monthly-report-template-for-channel-exchanges',
    'ai-assisted-workflow-for-youtube-collaboration',
]);

function getSectionVisual(article, sectionIndex, heading) {
    if (!article || !VISUAL_ARTICLE_SLUGS.has(article.slug)) {
        return null;
    }

    const src = `/images/blog/content/${article.slug}-section-${sectionIndex + 1}.svg`;
    const alt = `${article.title}: ${heading}`;
    const caption = `Ілюстрація до розділу: ${heading}`;
    return { src, alt, caption };
}

function ChartBlock({ chart }) {
    if (!chart || !Array.isArray(chart.data) || chart.data.length === 0) {
        return null;
    }

    const lineSeries = Array.isArray(chart.series) ? chart.series : [];

    return (
        <section className="blog-chart-card">
            <h3>{chart.title}</h3>
            {chart.description ? <p>{chart.description}</p> : null}

            <div className="blog-chart-wrap">
                <ResponsiveContainer width="100%" height={300}>
                    {chart.type === 'bar' ? (
                        <BarChart data={chart.data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#d9e8f8" />
                            <XAxis dataKey={chart.xKey} />
                            <YAxis />
                            <Tooltip />
                            {lineSeries.map((series) => (
                                <Bar key={series.key} dataKey={series.key} name={series.name} fill={series.color || '#005bbb'} radius={[6, 6, 0, 0]} />
                            ))}
                        </BarChart>
                    ) : (
                        <LineChart data={chart.data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#d9e8f8" />
                            <XAxis dataKey={chart.xKey} />
                            <YAxis />
                            <Tooltip />
                            {lineSeries.map((series) => (
                                <Line key={series.key} type="monotone" dataKey={series.key} name={series.name} stroke={series.color || '#005bbb'} strokeWidth={3} dot={{ r: 3 }} />
                            ))}
                        </LineChart>
                    )}
                </ResponsiveContainer>
            </div>

            {Array.isArray(chart.insights) && chart.insights.length > 0 ? (
                <ul className="blog-chart-insights">
                    {chart.insights.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
            ) : null}
        </section>
    );
}

export default function BlogArticlePage() {
    const navigate = useNavigate();
    const { slug } = useParams();
    const article = getBlogArticleBySlug(slug);

    const related = useMemo(() => {
        if (!article) {
            return [];
        }

        if (Array.isArray(article.relatedSlugs) && article.relatedSlugs.length > 0) {
            return article.relatedSlugs
                .map((relatedSlug) => getBlogArticleBySlug(relatedSlug))
                .filter(Boolean)
                .map((item) => ({ slug: item.slug, title: item.title, excerpt: item.excerpt, coverImage: item.coverImage }));
        }

        return getRelatedBlogArticles(article.slug, 3);
    }, [article]);

    useEffect(() => {
        if (!article) {
            applyPageSeo({
                title: 'Статтю не знайдено - Блог Біржа Каналів',
                description: 'Запитана стаття відсутня або була переміщена.',
                path: `/blog/${slug || ''}`,
                type: 'article',
            });
            return;
        }

        applyPageSeo({
            title: article.seoTitle,
            description: article.seoDescription,
            keywords: article.keywords,
            path: `/blog/${article.slug}`,
            image: article.coverImage,
            type: 'article',
        });

        applyJsonLd('blog-article-schema', buildBlogArticleJsonLd(article));
        applyJsonLd('blog-article-faq-schema', buildBlogArticleFaqJsonLd(article));
        applyJsonLd('blog-article-breadcrumb-schema', buildBreadcrumbJsonLd([
            { name: 'Головна', path: '/' },
            { name: 'Блог', path: '/blog' },
            { name: article.title, path: `/blog/${article.slug}` },
        ]));
    }, [article, slug]);

    return (
        <PublicLayout>
            <article className="blog-article-page">
                <div className="blog-article-inner">
                    <button className="blog-back" onClick={() => navigate('/blog')}>
                        <ArrowLeft size={16} /> Назад до блогу
                    </button>

                    {!article ? (
                        <section className="blog-not-found">
                            <h1>Статтю не знайдено</h1>
                            <p>Спробуйте повернутись на головну сторінку та вибрати інший матеріал.</p>
                            <button onClick={() => navigate('/')} className="blog-primary-btn">
                                На головну
                            </button>
                        </section>
                    ) : (
                        <>
                            <header className="blog-article-hero">
                                <div className="blog-article-meta">
                                    <span>{article.publishedAt}</span>
                                    <span>{article.readTime}</span>
                                    {article.tags.map((tag) => (
                                        <span key={tag} className="tag">{tag}</span>
                                    ))}
                                </div>
                                <h1>{article.title}</h1>
                                <p>{article.excerpt}</p>
                                <img src={article.coverImage} alt={article.coverAlt} />
                            </header>

                            <section className="blog-article-content">
                                {article.sections.map((section, sectionIndex) => {
                                    const visual = getSectionVisual(article, sectionIndex, section.heading);

                                    return (
                                    <section key={section.heading}>
                                        <h2>{section.heading}</h2>
                                        {visual ? (
                                            <figure className="blog-section-figure">
                                                <img src={visual.src} alt={visual.alt} loading="lazy" />
                                                <figcaption>{visual.caption}</figcaption>
                                            </figure>
                                        ) : null}
                                        {section.paragraphs.map((paragraph) => (
                                            <p key={paragraph}>{paragraph}</p>
                                        ))}
                                    </section>
                                    );
                                })}
                            </section>

                            <ChartBlock chart={article.chart} />

                            {Array.isArray(article.faq) && article.faq.length > 0 ? (
                                <section className="blog-faq-card">
                                    <h3>FAQ по темі</h3>
                                    <div className="blog-faq-list">
                                        {article.faq.map((item) => (
                                            <details key={item.q}>
                                                <summary>{item.q}</summary>
                                                <p>{item.a}</p>
                                            </details>
                                        ))}
                                    </div>
                                </section>
                            ) : null}

                            {related.length > 0 ? (
                                <section className="blog-related-card">
                                    <h3>Читайте також</h3>
                                    <div className="blog-related-grid">
                                        {related.map((item) => (
                                            <article key={item.slug} className="blog-related-item">
                                                <img src={item.coverImage} alt="" loading="lazy" />
                                                <div>
                                                    <h4>{item.title}</h4>
                                                    <p>{item.excerpt}</p>
                                                    <button onClick={() => navigate(`/blog/${item.slug}`)}>Перейти до статті</button>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </section>
                            ) : null}
                        </>
                    )}
                </div>
            </article>
        </PublicLayout>
    );
}

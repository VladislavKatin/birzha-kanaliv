import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import PublicLayout from '../../components/layout/PublicLayout';
import { filterBlogArticlesByTag, getAllBlogTags, getBlogArticlesPreview } from '../../services/blogArticles';
import { applyJsonLd, applyPageSeo, buildBlogCollectionJsonLd } from '../../services/seo';
import './BlogListPage.css';

export default function BlogListPage() {
    const navigate = useNavigate();
    const [activeTag, setActiveTag] = useState('All');
    const tags = useMemo(() => getAllBlogTags(), []);
    const allArticles = useMemo(() => getBlogArticlesPreview(), []);

    const articles = useMemo(() => filterBlogArticlesByTag(activeTag), [activeTag]);

    useEffect(() => {
        applyPageSeo({
            title: 'Блог Біржа Каналів - практичні статті для росту YouTube-каналу',
            description: 'Блог Біржа Каналів: стратегії колаборацій, репутації та системного росту YouTube-каналу у 2026 році.',
            keywords: ['блог youtube', 'просування youtube', 'колаборації youtube', 'trust score youtube'],
            path: '/blog',
            type: 'website',
        });

        applyJsonLd('blog-list-schema', buildBlogCollectionJsonLd(allArticles));
    }, [allArticles]);

    return (
        <PublicLayout>
            <section className="blog-list-page">
                <div className="blog-list-inner">
                    <button className="blog-list-back" onClick={() => navigate('/#blog')}>
                        <ArrowLeft size={16} /> На головну
                    </button>

                    <header className="blog-list-header">
                        <h1>Блог Біржа Каналів</h1>
                        <p>Матеріали для українських креаторів: як будувати партнерства, посилювати репутацію і рости стабільно.</p>
                    </header>

                    <div className="blog-tag-filters" role="tablist" aria-label="Blog tags filter">
                        {tags.map((tag) => (
                            <button
                                key={tag}
                                type="button"
                                className={`blog-tag-btn ${activeTag === tag ? 'active' : ''}`}
                                onClick={() => setActiveTag(tag)}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>

                    <div className="blog-list-grid">
                        {articles.map((article) => (
                            <article key={article.slug} className="blog-list-card">
                                <img src={article.coverImage} alt={article.coverAlt} loading="lazy" />
                                <div className="blog-list-card-body">
                                    <div className="blog-list-meta">
                                        <span>{article.publishedAt}</span>
                                        <span>{article.readTime}</span>
                                    </div>
                                    <h2>{article.title}</h2>
                                    <p>{article.excerpt}</p>
                                    <div className="blog-list-card-tags">
                                        {article.tags.map((tag) => (
                                            <span key={`${article.slug}-${tag}`}>{tag}</span>
                                        ))}
                                    </div>
                                    <button className="blog-list-link" onClick={() => navigate(`/blog/${article.slug}`)}>
                                        Читати статтю <ArrowRight size={16} />
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}

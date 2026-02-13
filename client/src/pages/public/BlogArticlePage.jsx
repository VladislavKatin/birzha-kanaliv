import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PublicLayout from '../../components/layout/PublicLayout';
import { getBlogArticleBySlug } from '../../services/blogArticles';
import { applyJsonLd, applyPageSeo, buildBlogArticleJsonLd } from '../../services/seo';
import './BlogArticlePage.css';

export default function BlogArticlePage() {
    const navigate = useNavigate();
    const { slug } = useParams();
    const article = getBlogArticleBySlug(slug);

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
                                {article.sections.map((section) => (
                                    <section key={section.heading}>
                                        <h2>{section.heading}</h2>
                                        {section.paragraphs.map((paragraph) => (
                                            <p key={paragraph}>{paragraph}</p>
                                        ))}
                                    </section>
                                ))}
                            </section>
                        </>
                    )}
                </div>
            </article>
        </PublicLayout>
    );
}


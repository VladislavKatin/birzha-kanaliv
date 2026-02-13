import assert from 'node:assert/strict';
import { buildBlogArticleFaqJsonLd, buildBlogArticleJsonLd, buildBlogCollectionJsonLd, buildSeoPayload } from './seo.js';
import { getBlogArticleBySlug, getBlogArticlesPreview } from './blogArticles.js';

export function runSeoFunctionalTests() {
    const payload = buildSeoPayload({
        title: 'Test title',
        description: 'Test description',
        keywords: ['one', 'two'],
        path: '/blog/test',
        image: '/images/test.svg',
        type: 'article',
    });

    assert.equal(payload.title, 'Test title');
    assert.equal(payload.keywords, 'one, two');
    assert.equal(payload.url, 'https://youtoobe.app/blog/test');
    assert.equal(payload.image, 'https://youtoobe.app/images/test.svg');

    const listSchema = buildBlogCollectionJsonLd(getBlogArticlesPreview());
    assert.equal(listSchema['@type'], 'Blog');
    assert.equal(listSchema.blogPost.length, 12);

    const article = getBlogArticleBySlug('youtube-collab-strategy-2026');
    const articleSchema = buildBlogArticleJsonLd(article);
    assert.equal(articleSchema['@type'], 'BlogPosting');
    assert.equal(articleSchema.mainEntityOfPage, 'https://youtoobe.app/blog/youtube-collab-strategy-2026');

    const faqSchema = buildBlogArticleFaqJsonLd(article);
    assert.equal(faqSchema['@type'], 'FAQPage');
    assert.equal(Array.isArray(faqSchema.mainEntity), true);
    assert.equal(faqSchema.mainEntity.length > 0, true);
}


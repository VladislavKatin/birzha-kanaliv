import assert from 'node:assert/strict';
import {
    buildBlogArticleFaqJsonLd,
    buildBlogArticleJsonLd,
    buildBlogCollectionJsonLd,
    buildBreadcrumbJsonLd,
    buildOrganizationJsonLd,
    buildSeoPayload,
    buildWebsiteJsonLd,
} from './seo.js';
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
    assert.equal(payload.url, 'https://birzha-kanaliv.biz.ua/blog/test');
    assert.equal(payload.image, 'https://birzha-kanaliv.biz.ua/images/test.svg');
    assert.equal(payload.robots, 'index,follow,max-image-preview:large');

    const listSchema = buildBlogCollectionJsonLd(getBlogArticlesPreview());
    assert.equal(listSchema['@type'], 'Blog');
    assert.equal(listSchema.blogPost.length, 42);

    const article = getBlogArticleBySlug('youtube-collab-strategy-2026');
    const articleSchema = buildBlogArticleJsonLd(article);
    assert.equal(articleSchema['@type'], 'BlogPosting');
    assert.equal(articleSchema.mainEntityOfPage, 'https://birzha-kanaliv.biz.ua/blog/youtube-collab-strategy-2026');

    const faqSchema = buildBlogArticleFaqJsonLd(article);
    assert.equal(faqSchema['@type'], 'FAQPage');
    assert.equal(Array.isArray(faqSchema.mainEntity), true);
    assert.equal(faqSchema.mainEntity.length > 0, true);

    const organizationSchema = buildOrganizationJsonLd();
    assert.equal(organizationSchema['@type'], 'Organization');
    assert.equal(typeof organizationSchema.contactPoint.email, 'string');

    const websiteSchema = buildWebsiteJsonLd();
    assert.equal(websiteSchema['@type'], 'WebSite');
    assert.equal(typeof websiteSchema.potentialAction.target, 'string');

    const breadcrumbSchema = buildBreadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
    ]);
    assert.equal(breadcrumbSchema['@type'], 'BreadcrumbList');
    assert.equal(breadcrumbSchema.itemListElement.length, 2);
}



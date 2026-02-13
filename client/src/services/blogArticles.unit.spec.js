import assert from 'node:assert/strict';
import {
    filterBlogArticlesByTag,
    getAllBlogTags,
    getBlogArticleBySlug,
    getBlogArticlesPreview,
    getRelatedBlogArticles,
} from './blogArticles.js';

export function runBlogArticlesUnitTests() {
    const previews = getBlogArticlesPreview();
    assert.equal(previews.length, 7);
    assert.equal(previews[0].slug, 'youtube-collab-strategy-2026');

    const article = getBlogArticleBySlug('youtube-trust-score-and-reviews');
    assert.equal(article.tags.includes('Trust score'), true);
    assert.equal(article.sections.length > 0, true);
    assert.equal(Array.isArray(article.faq), true);
    assert.equal(Array.isArray(article.chart.data), true);

    const tags = getAllBlogTags();
    assert.equal(tags.includes('All'), true);
    assert.equal(tags.includes('YouTube'), true);
    assert.equal(tags.includes('Monetization'), true);

    const filtered = filterBlogArticlesByTag('Reviews');
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].slug, 'youtube-trust-score-and-reviews');

    assert.equal(filterBlogArticlesByTag('All').length, previews.length);

    const related = getRelatedBlogArticles('youtube-collab-strategy-2026', 3);
    assert.equal(related.length, 3);
    assert.equal(related.some((item) => item.slug === 'youtube-collab-strategy-2026'), false);
}

import assert from 'node:assert/strict';
import {
    filterBlogArticlesByTag,
    getAllBlogTags,
    getBlogArticleBySlug,
    getBlogArticlesPreview,
} from './blogArticles.js';

export function runBlogArticlesUnitTests() {
    const previews = getBlogArticlesPreview();
    assert.equal(previews.length, 2);
    assert.equal(previews[0].slug, 'youtube-collab-strategy-2026');

    const article = getBlogArticleBySlug('youtube-trust-score-and-reviews');
    assert.equal(article.tags.includes('Trust score'), true);
    assert.equal(article.sections.length > 0, true);

    const tags = getAllBlogTags();
    assert.equal(tags.includes('All'), true);
    assert.equal(tags.includes('YouTube'), true);

    const filtered = filterBlogArticlesByTag('Reviews');
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].slug, 'youtube-trust-score-and-reviews');

    assert.equal(filterBlogArticlesByTag('All').length, previews.length);
}

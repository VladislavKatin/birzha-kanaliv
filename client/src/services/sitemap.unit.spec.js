import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(CURRENT_DIR, '..', '..', 'public');

function readFile(relativePath) {
    return fs.readFileSync(path.join(PUBLIC_DIR, relativePath), 'utf8');
}

export function runSitemapUnitTests() {
    const sitemapIndex = readFile('sitemap.xml');
    const pagesSitemap = readFile('sitemap-pages.xml');
    const blogSitemap = readFile('sitemap-blog.xml');

    assert.equal(sitemapIndex.includes('sitemap-pages.xml'), true);
    assert.equal(sitemapIndex.includes('sitemap-blog.xml'), true);

    const disallowedInSitemaps = [
        '/auth',
        '/dashboard',
        '/my-channels',
        '/swaps',
        '/support',
        '/admin',
    ];

    disallowedInSitemaps.forEach((segment) => {
        assert.equal(pagesSitemap.includes(segment), false, `pages sitemap must not include ${segment}`);
        assert.equal(blogSitemap.includes(segment), false, `blog sitemap must not include ${segment}`);
    });

    assert.equal(pagesSitemap.includes('https://birzha-kanaliv.biz.ua/help'), true);
    assert.equal(blogSitemap.includes('/blog/youtube-collab-strategy-2026'), true);
}

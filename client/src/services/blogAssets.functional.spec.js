import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
    getAllBlogArticles,
    getBlogVisualSectionPaths,
} from './blogArticles.js';

function publicPathToFsPath(publicPath) {
    return path.join(process.cwd(), 'public', publicPath.replace(/^\//, '').replace(/\//g, path.sep));
}

export function runBlogAssetsFunctionalTests() {
    const articles = getAllBlogArticles();

    for (const article of articles) {
        const coverPath = publicPathToFsPath(article.coverImage);
        assert.equal(fs.existsSync(coverPath), true, `missing blog cover image for ${article.slug}: ${article.coverImage}`);

        for (const visualPath of getBlogVisualSectionPaths(article.slug)) {
            const fsPath = publicPathToFsPath(visualPath);
            assert.equal(fs.existsSync(fsPath), true, `missing blog section visual for ${article.slug}: ${visualPath}`);
        }
    }
}

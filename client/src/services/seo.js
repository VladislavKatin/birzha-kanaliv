const BASE_URL = 'https://youtoobe.app';

function toAbsoluteUrl(path) {
    if (!path) {
        return BASE_URL;
    }

    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildSeoPayload(input = {}) {
    const title = input.title || 'YouToobe';
    const description = input.description || 'YouToobe platform';
    const keywords = Array.isArray(input.keywords) ? input.keywords.join(', ') : '';
    const url = toAbsoluteUrl(input.path || '/');
    const image = toAbsoluteUrl(input.image || '/icons/icon-512.png');

    return {
        title,
        description,
        keywords,
        url,
        image,
        type: input.type || 'website',
    };
}

export function buildBlogCollectionJsonLd(articles = []) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'YouToobe Blog',
        description: 'Практичні матеріали для розвитку YouTube-каналу',
        url: `${BASE_URL}/#blog`,
        blogPost: articles.map(article => ({
            '@type': 'BlogPosting',
            headline: article.title,
            datePublished: article.publishedAt,
            url: `${BASE_URL}/blog/${article.slug}`,
        })),
    };
}

export function buildBlogArticleJsonLd(article) {
    if (!article) {
        return null;
    }

    return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: article.title,
        description: article.seoDescription,
        image: toAbsoluteUrl(article.coverImage),
        datePublished: article.publishedAt,
        author: {
            '@type': 'Organization',
            name: 'YouToobe',
        },
        publisher: {
            '@type': 'Organization',
            name: 'YouToobe',
        },
        mainEntityOfPage: `${BASE_URL}/blog/${article.slug}`,
    };
}

function upsertMeta(selector, attrName, attrValue, content) {
    if (!document) {
        return;
    }

    let tag = document.querySelector(selector);

    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attrName, attrValue);
        document.head.appendChild(tag);
    }

    tag.setAttribute('content', content);
}

export function applyPageSeo(input = {}) {
    if (typeof document === 'undefined') {
        return buildSeoPayload(input);
    }

    const payload = buildSeoPayload(input);
    document.title = payload.title;

    upsertMeta('meta[name="description"]', 'name', 'description', payload.description);
    upsertMeta('meta[name="keywords"]', 'name', 'keywords', payload.keywords);
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', payload.title);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', payload.description);
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', payload.type);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', payload.url);
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', payload.image);
    upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', payload.title);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', payload.description);
    upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', payload.image);

    let canonical = document.querySelector('link[rel="canonical"]');

    if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
    }

    canonical.setAttribute('href', payload.url);

    return payload;
}

export function applyJsonLd(id, schemaObject) {
    if (typeof document === 'undefined' || !schemaObject) {
        return;
    }

    const existing = document.getElementById(id);

    if (existing) {
        existing.remove();
    }

    const script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schemaObject);
    document.head.appendChild(script);
}

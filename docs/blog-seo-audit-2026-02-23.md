# Blog SEO Audit and Fixes (2026-02-23)

## Scope
- Source: `client/src/services/blogArticles.js`
- Pages: `/blog`, `/blog/:slug`, homepage blog cards
- Articles checked: 42

## What was audited
1. `seoTitle` length target: 50-75 chars.
2. `seoDescription` length target: 120-170 chars.
3. Image alt quality for cover image.
4. Keywords count and duplicates.
5. `relatedSlugs` validity and minimum amount for internal linking.
6. Link semantics (`button` vs real links) on blog list/cards.
7. Social/OpenGraph metadata completeness for article previews.

## Fixes implemented
1. Added centralized SEO normalization for all blog articles:
   - auto-clamp and improve `seoTitle`
   - auto-expand/clamp `seoDescription`
   - auto-fix weak `coverAlt`
   - auto-build deduplicated keyword set (up to 6)
   - auto-fill/repair `relatedSlugs` with valid internal links
2. Switched blog navigation elements to real links (`<Link>`), improving crawlability.
3. Added richer social metadata in SEO service:
   - `og:image:alt`
   - `twitter:url`
   - `twitter:image:alt`
4. Added image loading robustness:
   - `decoding="async"`
   - fallback image for broken blog assets
   - high fetch priority for article hero image

## Result after fixes
- Total audited articles: 42
- Remaining SEO rule violations by audit criteria: 0

## Changed files
- `client/src/services/blogArticles.js`
- `client/src/services/seo.js`
- `client/src/pages/public/BlogListPage.jsx`
- `client/src/pages/public/BlogListPage.css`
- `client/src/pages/public/BlogArticlePage.jsx`
- `client/src/pages/public/BlogArticlePage.css`
- `client/src/pages/public/HomePage.jsx`
- `client/src/pages/public/HomePage.css`

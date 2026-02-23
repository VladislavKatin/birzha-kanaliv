# Performance Audit Report (2026-02-23)

## Scope
- Frontend: `http://localhost:5173` (`/`, `/offers`, `/blog`)
- Admin frontend: `http://localhost:5174/auth`
- Mode: Lighthouse desktop + mobile

## Lighthouse Summary
| Page | Form factor | Performance | Accessibility | Best Practices | SEO | FCP (ms) | LCP (ms) | TBT (ms) | CLS |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Home | Desktop | 63 | 93 | 100 | 100 | 1772 | 5311 | 143 | 0.000 |
| Home | Mobile | 32 | 93 | 100 | 100 | 9326 | 30295 | 1289 | 0.000 |
| Offers | Desktop | 71 | 87 | 100 | 100 | 1551 | 3396 | 58 | 0.000 |
| Offers | Mobile | 36 | 87 | 100 | 100 | 9673 | 19265 | 843 | 0.005 |
| Blog | Desktop | 62 | 90 | 100 | 100 | 1523 | 4866 | 196 | 0.000 |
| Blog | Mobile | 31 | 90 | 100 | 100 | 9081 | 29934 | 1416 | 0.000 |
| Admin Auth | Desktop | 68 | 86 | 100 | 66 | 1888 | 3686 | 22 | 0.000 |
| Admin Auth | Mobile | 45 | 87 | 100 | 66 | 9131 | 18946 | 454 | 0.000 |

## Before/After Bundle Optimization
- Client main chunk:
  - Before: `~456 KB` (`~147 KB gzip`)
  - After: `~36.8 KB` (`~11.8 KB gzip`)
- Admin main chunk:
  - Before: `~437.8 KB` (`~136.1 KB gzip`)
  - After: `~11.4 KB` (`~4.6 KB gzip`)

## Interpretation
- JS delivery is significantly improved for first load due to chunk split and lazy routes.
- Mobile Lighthouse remains low mostly due to runtime/network constraints and heavy dynamic UI blocks (charts + rich dashboard widgets).

## Next Priority Actions
1. SSR/SSG critical content for `/`, `/offers`, `/blog` to improve LCP on mobile.
2. Defer chart rendering until visible (`IntersectionObserver`) on dashboard/blog article pages.
3. Add image optimization pipeline (WebP/AVIF + responsive `srcset`).
4. Add long-term cache headers for hashed assets at CDN/edge.
5. Run same audit on production domain from external network and compare with this baseline.

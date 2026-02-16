# Domain Launch Checklist: birzha-kanaliv.biz.ua

## 1. DNS

- `A` record: `@ -> <SERVER_IP>`
- `A` record: `www -> <SERVER_IP>`
- If split by subdomain:
- `A` record: `api -> <SERVER_IP>`
- `A` record: `admin -> <SERVER_IP>`

## 2. Reverse Proxy

- Configure vhost for:
- `birzha-kanaliv.biz.ua`
- `www.birzha-kanaliv.biz.ua`
- Serve client build as static files.
- Proxy `/api` to backend (`localhost:3001`).
- Add SPA fallback: unknown routes -> `index.html`.

## 3. TLS/HTTPS

- Issue Let's Encrypt certificate for root + `www` (+ subdomains if used).
- Force redirect `http -> https`.

## 4. Backend Environment

- Set `CLIENT_URLS` (comma-separated), for example:
- `https://birzha-kanaliv.biz.ua,https://www.birzha-kanaliv.biz.ua,https://admin.birzha-kanaliv.biz.ua`
- Set `CLIENT_URL=https://birzha-kanaliv.biz.ua` for OAuth callback redirect target.

## 5. Frontend Environment

- Set `VITE_API_URL` in `client/.env`:
- `https://api.birzha-kanaliv.biz.ua/api` (or root domain `/api` variant).
- Set `VITE_API_URL` in `admin-frontend/.env` to the same API.
- Rebuild:
- `npm run build`
- `npm run build:admin`

## 6. Firebase / Google OAuth

- Firebase Auth -> Authorized domains:
- `birzha-kanaliv.biz.ua`
- `www.birzha-kanaliv.biz.ua`
- `admin.birzha-kanaliv.biz.ua` (if used)
- Google OAuth consent/client:
- add JS origins and redirect URIs for production domain(s).

## 7. Telegram / Integrations

- Update webhook URLs to production HTTPS domain.
- Verify bot callbacks reachable from internet.

## 8. SEO

- Ensure canonical domain is `https://birzha-kanaliv.biz.ua`.
- Add `robots.txt` and `sitemap.xml`.
- Add 301 redirect from old domain(s), if any.

## 9. Smoke Test

- Open landing, offers, blog, faq, privacy, terms.
- Test Google login.
- Test channel connect flow.
- Test chats, notifications, and admin page.
- Validate no CORS errors in browser console.

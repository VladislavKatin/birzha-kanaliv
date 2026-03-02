# Cloud Deploy Env Setup

Use this file as a copy/paste checklist for production deployment.

## Generated JWT secret

Generate a strong secret and paste it into Railway Variables. Do not commit it to git:

```env
JWT_SECRET=PASTE_GENERATED_SECRET_HERE
```

## Railway backend variables

Service root directory:

```text
server
```

Build command:

```text
npm install
```

Start command:

```text
npm start
```

Variables to create in Railway:

```env
DATABASE_URL=PASTE_SUPABASE_CONNECTION_STRING_HERE
DB_SSL=true
NODE_ENV=production
CLIENT_URLS=https://birzha-kanaliv.biz.ua,https://admin.birzha-kanaliv.biz.ua
JWT_SECRET=PASTE_GENERATED_SECRET_HERE
GOOGLE_CLIENT_ID=PASTE_GOOGLE_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=PASTE_GOOGLE_CLIENT_SECRET_HERE
GOOGLE_REDIRECT_URI=https://api.birzha-kanaliv.biz.ua/api/youtube/callback
FIREBASE_PROJECT_ID=PASTE_FIREBASE_PROJECT_ID_HERE
FIREBASE_PRIVATE_KEY=PASTE_FIREBASE_PRIVATE_KEY_HERE
FIREBASE_CLIENT_EMAIL=PASTE_FIREBASE_CLIENT_EMAIL_HERE
TELEGRAM_BOT_TOKEN=PASTE_TELEGRAM_BOT_TOKEN_HERE
TELEGRAM_BOT_USERNAME=PASTE_TELEGRAM_BOT_USERNAME_HERE
TELEGRAM_LINK_SECRET=PASTE_TELEGRAM_LINK_SECRET_HERE
OAUTH_STATE_SECRET=PASTE_OAUTH_STATE_SECRET_HERE
APP_ENCRYPTION_KEY=PASTE_APP_ENCRYPTION_KEY_HERE
```

Optional:

```env
REDIS_URL=
```

## Cloudflare Pages: client

Project settings:

```text
Framework preset: Vite
Root directory: client
Build command: npm run build
Build output directory: dist
Production branch: main
```

Environment variables:

```env
VITE_API_URL=https://api.birzha-kanaliv.biz.ua/api
```

Custom domain:

```text
birzha-kanaliv.biz.ua
```

Optional:

```text
www.birzha-kanaliv.biz.ua
```

## Cloudflare Pages: admin

Project settings:

```text
Framework preset: Vite
Root directory: admin-frontend
Build command: npm run build
Build output directory: dist
Production branch: main
```

Environment variables:

```env
VITE_API_URL=https://api.birzha-kanaliv.biz.ua/api
```

Custom domain:

```text
admin.birzha-kanaliv.biz.ua
```

## Cloudflare DNS

Create or verify these records:

```text
@      -> Cloudflare Pages project for client
www    -> Cloudflare Pages project for client
admin  -> Cloudflare Pages project for admin
api    -> CNAME to your Railway public domain
```

`api` should be proxied by Cloudflare.

## Final checks

Verify these URLs after deployment:

```text
https://birzha-kanaliv.biz.ua
https://admin.birzha-kanaliv.biz.ua
https://api.birzha-kanaliv.biz.ua/health
https://api.birzha-kanaliv.biz.ua/api/offers
```

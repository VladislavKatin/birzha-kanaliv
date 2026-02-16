# External Integrations Checklist: birzha-kanaliv.biz.ua

Дата: 16 лютого 2026

Це чеклист зовнішніх систем, які потрібно налаштувати поза кодом, щоб продакшн працював стабільно.

## 1. Firebase Authentication

Консоль: Firebase -> Authentication -> Settings -> Authorized domains

Додати домени:

- `birzha-kanaliv.biz.ua`
- `www.birzha-kanaliv.biz.ua`
- `admin.birzha-kanaliv.biz.ua`

Перевірити:

- Google Sign-In enabled
- немає помилки `auth/unauthorized-domain` при вході

## 2. Google Cloud OAuth (Credentials)

Консоль: Google Cloud -> APIs & Services -> Credentials -> OAuth 2.0 Client ID

### Authorized JavaScript origins

- `https://birzha-kanaliv.biz.ua`
- `https://www.birzha-kanaliv.biz.ua`
- `https://admin.birzha-kanaliv.biz.ua`

### Authorized redirect URIs

Залежить від фактичного endpoint у backend.
Якщо callback обробляється backend, додати production callback URI з сервера.

Перевірити:

- OAuth consent screen не в тестовому/обмеженому стані для ваших користувачів
- відсутня помилка redirect mismatch

## 3. YouTube API / OAuth Scope

Консоль: Google Cloud -> APIs & Services -> Library / OAuth Consent

Переконатися:

- YouTube Data API v3 увімкнений
- потрібні scopes додані в OAuth consent
- домен проєкту відповідає production

## 4. Telegram Bot

Необхідні env у backend:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME`
- `TELEGRAM_LINK_SECRET`

Перевірити:

- бот відповідає в Telegram
- linking flow (отримання коду/прив'язка) працює
- API endpoint `/api/profile/notifications/telegram-link` повертає коректні дані

Якщо використовується webhook:

- URL webhook переведений на production HTTPS
- сертифікат валідний

## 5. DNS + TLS + доступність

Перевірити через `dig` / `nslookup`:

- `birzha-kanaliv.biz.ua`
- `www.birzha-kanaliv.biz.ua`
- `admin.birzha-kanaliv.biz.ua`
- `api.birzha-kanaliv.biz.ua`

Перевірити HTTPS:

- сертифікати валідні
- автооновлення certbot працює
- редірект `http -> https` увімкнений

## 6. CORS / CLIENT_URLS

У `server/.env`:

- `CLIENT_URL=https://birzha-kanaliv.biz.ua`
- `CLIENT_URLS=https://birzha-kanaliv.biz.ua,https://www.birzha-kanaliv.biz.ua,https://admin.birzha-kanaliv.biz.ua`

Перевірити:

- немає CORS помилок при логіні з frontend та admin

## 7. Frontend ENV

`client/.env`:

- `VITE_API_URL=https://api.birzha-kanaliv.biz.ua/api` (або same-origin `/api`)

`admin-frontend/.env`:

- `VITE_API_URL=https://api.birzha-kanaliv.biz.ua/api`

Після змін:

- обов'язково перезбірка frontend/admin

## 8. Post-release verification (мінімум)

- Login через Google на frontend
- Login через Google на admin-frontend
- Підключення YouTube каналу
- Створення/перегляд пропозицій
- Чати та статуси обмінів
- Push/Telegram сповіщення


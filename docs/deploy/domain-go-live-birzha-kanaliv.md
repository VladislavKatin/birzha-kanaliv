# Go-Live Guide: birzha-kanaliv.biz.ua

Це покрокова інструкція для запуску продакшн-оточення на одному сервері (Ubuntu + Nginx + systemd + Let's Encrypt).

## 1. DNS

У реєстратора домену:

- `A @ -> <SERVER_IP>`
- `A www -> <SERVER_IP>`
- `A admin -> <SERVER_IP>`
- `A api -> <SERVER_IP>`

Почекати оновлення DNS (зазвичай 5-30 хв, інколи довше).

## 2. Пакети на сервері

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

## 3. Код і збірка

```bash
cd /var/www
git clone <your-repo-url> youtoobe
cd /var/www/youtoobe
npm install
cd client && npm install && npm run build
cd ../admin-frontend && npm install && npm run build
cd ../server && npm install
```

## 4. ENV (production)

`/var/www/youtoobe/server/.env`:

- `NODE_ENV=production`
- `PORT=3001`
- `CLIENT_URL=https://birzha-kanaliv.biz.ua`
- `CLIENT_URLS=https://birzha-kanaliv.biz.ua,https://www.birzha-kanaliv.biz.ua,https://admin.birzha-kanaliv.biz.ua`
- `GOOGLE_REDIRECT_URI` з production callback
- Firebase/DB/Telegram змінні

`/var/www/youtoobe/client/.env`:

- `VITE_API_URL=https://api.birzha-kanaliv.biz.ua/api` (або `https://birzha-kanaliv.biz.ua/api`)

`/var/www/youtoobe/admin-frontend/.env`:

- `VITE_API_URL=https://api.birzha-kanaliv.biz.ua/api`

Після змін `.env` для фронтендів знову зробити build.

## 5. systemd для API

```bash
sudo cp /var/www/youtoobe/docs/deploy/systemd-youtoobe-api.service /etc/systemd/system/youtoobe-api.service
sudo systemctl daemon-reload
sudo systemctl enable youtoobe-api
sudo systemctl start youtoobe-api
sudo systemctl status youtoobe-api --no-pager
```

## 6. Nginx конфіг

```bash
sudo cp /var/www/youtoobe/docs/deploy/nginx-birzha-kanaliv.conf /etc/nginx/sites-available/birzha-kanaliv.conf
sudo ln -s /etc/nginx/sites-available/birzha-kanaliv.conf /etc/nginx/sites-enabled/birzha-kanaliv.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 7. SSL сертифікат (Let's Encrypt)

```bash
sudo certbot --nginx \
  -d birzha-kanaliv.biz.ua \
  -d www.birzha-kanaliv.biz.ua \
  -d admin.birzha-kanaliv.biz.ua \
  -d api.birzha-kanaliv.biz.ua
```

Під час майстра обрати редірект з HTTP на HTTPS.

Перевірка автооновлення:

```bash
sudo certbot renew --dry-run
```

## 8. Firebase/Google налаштування

- Firebase Auth -> Authorized domains:
- `birzha-kanaliv.biz.ua`
- `www.birzha-kanaliv.biz.ua`
- `admin.birzha-kanaliv.biz.ua`
- У Google OAuth Client додати production origins + redirect URIs.

## 9. Smoke tests

Перевірити:

- `https://birzha-kanaliv.biz.ua`
- `https://admin.birzha-kanaliv.biz.ua`
- `https://api.birzha-kanaliv.biz.ua/health`
- логін через Google
- підключення YouTube каналу
- каталог, чати, сповіщення, адмінку
- відсутність CORS помилок в DevTools

## 10. Корисні команди

```bash
sudo journalctl -u youtoobe-api -f
sudo systemctl restart youtoobe-api
sudo nginx -t && sudo systemctl reload nginx
```

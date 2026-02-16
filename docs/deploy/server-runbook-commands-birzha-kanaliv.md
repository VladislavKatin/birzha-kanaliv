# Server Runbook Commands: birzha-kanaliv.biz.ua

Дата: 16 лютого 2026

Нижче готові команди для запуску на Ubuntu сервері.
Перед запуском заміни:

- `<SERVER_IP>`
- `<GIT_REPO_URL>`

## 1. Пакети

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx git curl
```

## 2. Код проєкту

```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone <GIT_REPO_URL> youtoobe
sudo chown -R $USER:$USER /var/www/youtoobe
cd /var/www/youtoobe
```

## 3. Node.js (якщо ще не встановлено)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

## 4. Встановлення залежностей і збірка

```bash
cd /var/www/youtoobe
npm install
cd client && npm install && npm run build
cd ../admin-frontend && npm install && npm run build
cd ../server && npm install
```

## 5. ENV файли

### 5.1 Backend

```bash
cd /var/www/youtoobe/server
cp .env.example .env
nano .env
```

Мінімально перевірити в `.env`:

- `NODE_ENV=production`
- `PORT=3001`
- `CLIENT_URL=https://birzha-kanaliv.biz.ua`
- `CLIENT_URLS=https://birzha-kanaliv.biz.ua,https://www.birzha-kanaliv.biz.ua,https://admin.birzha-kanaliv.biz.ua`
- DB/Firebase/Telegram змінні

### 5.2 Frontend

```bash
cd /var/www/youtoobe/client
cp .env.example .env
nano .env
```

Встановити:

- `VITE_API_URL=https://api.birzha-kanaliv.biz.ua/api`

Після змін:

```bash
npm run build
```

### 5.3 Admin frontend

```bash
cd /var/www/youtoobe/admin-frontend
cp .env.example .env
nano .env
```

Встановити:

- `VITE_API_URL=https://api.birzha-kanaliv.biz.ua/api`

Після змін:

```bash
npm run build
```

## 6. Systemd для API

```bash
sudo cp /var/www/youtoobe/docs/deploy/systemd-youtoobe-api.service /etc/systemd/system/youtoobe-api.service
sudo systemctl daemon-reload
sudo systemctl enable youtoobe-api
sudo systemctl start youtoobe-api
sudo systemctl status youtoobe-api --no-pager
```

## 7. Nginx

```bash
sudo cp /var/www/youtoobe/docs/deploy/nginx-birzha-kanaliv.conf /etc/nginx/sites-available/birzha-kanaliv.conf
sudo ln -sf /etc/nginx/sites-available/birzha-kanaliv.conf /etc/nginx/sites-enabled/birzha-kanaliv.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 8. SSL (Let's Encrypt)

```bash
sudo certbot --nginx \
  -d birzha-kanaliv.biz.ua \
  -d www.birzha-kanaliv.biz.ua \
  -d admin.birzha-kanaliv.biz.ua \
  -d api.birzha-kanaliv.biz.ua
```

Перевірка оновлення:

```bash
sudo certbot renew --dry-run
```

## 9. Швидка перевірка після запуску

```bash
curl -I https://birzha-kanaliv.biz.ua
curl -I https://admin.birzha-kanaliv.biz.ua
curl https://api.birzha-kanaliv.biz.ua/health
curl https://birzha-kanaliv.biz.ua/robots.txt
curl https://birzha-kanaliv.biz.ua/sitemap.xml
```

## 10. Корисні команди обслуговування

```bash
sudo journalctl -u youtoobe-api -f
sudo systemctl restart youtoobe-api
sudo nginx -t && sudo systemctl reload nginx

cd /var/www/youtoobe
git pull
cd client && npm run build
cd ../admin-frontend && npm run build
sudo systemctl restart youtoobe-api
sudo systemctl reload nginx
```

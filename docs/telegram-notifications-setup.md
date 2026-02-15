# Telegram Notifications Setup

## 1. Create bot in Telegram
1. Open `@BotFather`.
2. Run `/newbot`.
3. Set bot name and username.
4. Copy bot token.

## 2. Configure server env
Add variables in `server/.env`:

```env
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_BOT_USERNAME=your_bot_username
TELEGRAM_LINK_SECRET=long_random_secret
```

## 3. Restart backend
The server starts Telegram polling automatically on boot.

## 4. User flow
1. Open `Налаштування -> Сповіщення`.
2. Click `Підключити Telegram`.
3. In Telegram click `Start`.
4. Return and click `Оновити статус`.
5. Enable toggle `Telegram-сповіщення` and save.
6. Click `Тест повідомлення` to verify.

## 5. Current events that send Telegram notifications
- New incoming exchange request (`/offers/:id/respond`).
- New message in exchange chat.

# Production Smoke Test Plan: birzha-kanaliv.biz.ua

Дата: 16 лютого 2026

Цей план проходиться після деплою і після будь-яких критичних змін інфраструктури.

## 1. Public routes

Перевірити відкриття сторінок (200, без JS помилок):

- `https://birzha-kanaliv.biz.ua/`
- `https://birzha-kanaliv.biz.ua/offers`
- `https://birzha-kanaliv.biz.ua/blog`
- `https://birzha-kanaliv.biz.ua/faq`
- `https://birzha-kanaliv.biz.ua/privacy`
- `https://birzha-kanaliv.biz.ua/terms`

SEO файли:

- `https://birzha-kanaliv.biz.ua/robots.txt`
- `https://birzha-kanaliv.biz.ua/sitemap.xml`

## 2. API availability

Перевірити:

- `https://api.birzha-kanaliv.biz.ua/health` -> `status: ok`

## 3. Auth flows

### Frontend

- Login через Google
- Logout
- повторний login без помилок

### Admin frontend

- Login через Google
- роль `admin` допускається до адмін-розділів
- роль `user` не допускається до адмін-розділів

## 4. YouTube connect flow

- Авторизований user проходить підключення каналу
- після callback є redirect на dashboard
- канал видно в `my-channels`
- канал відображається в списках пропозицій згідно логіки активності

## 5. Offers and swaps

- Відкрити `/offers` як гість
- `Предложить обмен` у гостя відкриває login flow
- Після login повернення на цільову пропозицію працює
- Створити/прийняти swap між двома тест-акаунтами
- Обидві сторони можуть підтвердити завершення угоди

## 6. Messages / chat

- Повідомлення між користувачами приходять в реальному часі
- Повідомлення з admin support працюють
- Можна прикріпити зображення в чаті
- Немає зайвих дубльованих чатів

## 7. Notifications

- Badge counters у меню оновлюються на нові події
- Telegram-link endpoint працює
- Тестове повідомлення (якщо ввімкнено) приходить у Telegram
- Push-сповіщення (якщо ввімкнено) приходять у браузер

## 8. Security and browser checks

- Немає CORS помилок у DevTools
- Немає mixed-content (усе через HTTPS)
- Немає 429 flood при базовій навігації
- Основні сторінки без критичних console errors

## 9. Admin checks

- `/admin` відкривається для admin
- Основні віджети аналітики завантажуються
- Керування ролями/блокуванням користувачів працює
- Логи/історія/експорти відкриваються без 500

## 10. Exit criteria

Реліз вважається успішним, якщо:

- Усі розділи 1-9 пройдені без blocker/critical помилок
- Немає 500 на ключових user flows
- OAuth, YouTube connect, offers, chat, admin підтверджені вручну

# Базис Проекта Для AI-Агента (Не Клон, А Основа)

## 1) Цель
Собрать новый веб-сервис marketplace/платформенного типа на проверенном стеке, используя архитектурные принципы и процессы из текущего проекта, но с новой доменной логикой и отдельным UX.

## 2) Рекомендуемый стек (проверен в текущем проекте)

### Frontend (пользовательский)
- React 19 (SPA)
- Vite 7
- React Router 7
- Zustand (глобальное состояние)
- Axios (HTTP клиент)
- Recharts (графики)
- react-hot-toast (уведомления)
- lucide-react (иконки)
- TailwindCSS 4 (можно оставить utility-first + слой кастомного CSS)

### Frontend (админ-панель отдельно)
- React 19 + Vite 7 на отдельном порту/домене
- Отдельный bundle и отдельная маршрутизация
- Тот же API backend, но отдельные guard-правила по ролям

### Backend
- Node.js + Express 5
- PostgreSQL
- Sequelize 6 + sequelize-cli (миграции и сиды)
- Socket.IO (реалтайм-чат/события)
- Firebase Admin (валидация identity токенов)
- Google APIs (если нужна интеграция с внешними платформами)
- BullMQ + Redis (фоновые задачи/очереди)
- express-rate-limit + rate-limit-redis (лимиты запросов)
- Helmet + CORS + Morgan

### Инфраструктура
- Cloudflare Tunnel (локальный/стейдж доступ по домену)
- robots.txt + sitemap index + раздельные sitemap для страниц/блога
- Отдельные env для client/server/admin

## 3) Архитектурные принципы (обязательно)

1. Разделение контуров:
- `client` (публичный/пользовательский UI)
- `admin-frontend` (админка)
- `server` (API + бизнес-логика + realtime)

2. Роли и доступ:
- RBAC минимум: `user`, `admin`
- Админ-роуты только через middleware авторизации и проверки роли

3. Транзакционность бизнес-операций:
- Любые критичные записи только через `sequelize.transaction()`
- При ошибке обязателен rollback
- После rollback писать запись в аудит лог с причиной

4. Аудит и трассировка:
- ActionLog для ключевых действий
- requestId в каждом запросе и в ответах с ошибкой

5. Ошибки API:
- Никаких сырых stack trace наружу
- Единый JSON формат ошибок
- Для продакшена: safe message для `5xx`

6. Производительность:
- Пагинация в каталогах/чатах/админ-таблицах
- Индексы БД под фильтры и сортировки
- Rate limit для API и строгий для auth/upload

7. Реалтайм:
- Socket события только после auth
- Гарантия идемпотентности (не дублировать сообщения/события)

8. SEO для публичных страниц:
- Только публичные URL в sitemap
- Приватные пути в robots `Disallow`
- Корректные коды ответа (не допускать `5xx` на индексируемых URL)

## 4) Базовая структура модулей backend

- `routes/` — слой HTTP
- `middleware/` — auth, role, error handler, rate limit
- `models/` — Sequelize модели
- `services/` — бизнес-логика (транзакции, внешние интеграции)
- `queues/` — фоновая обработка
- `migrations/` + `seeders/` — схема и тестовые данные

Правило: route тонкий, service толстый.

## 5) Базовая структура frontend

- `pages/` — экранные контейнеры
- `components/` — переиспользуемые UI блоки
- `services/` — API слой, SEO helpers, utilities
- `stores/` — Zustand stores
- `styles/` или локальные CSS modules

Правило: страница не должна напрямую держать сложную бизнес-логику API.

## 6) Минимальный набор качества

1. Тесты:
- Unit: сервисы, утилиты, бизнес-правила
- Functional/API: ключевые флоу
- Frontend contract tests для критичных сервисных функций

2. Линт/формат:
- ESLint + Prettier

3. CI baseline:
- install -> lint -> test -> build (client + admin + server)

## 7) Что НЕ копировать из текущего проекта

- Конкретные названия сущностей и UX-потоки 1:1
- Жестко прибитые доменные лимиты без конфигурации
- Текстовый контент/дизайн-решения как есть

Использовать только как инженерный шаблон: стек + слои + процессы качества.

## 8) Готовый промпт для AI-агента

```text
Построй новый marketplace-проект на этом стеке:
- Frontend: React 19 + Vite 7 + React Router 7 + Zustand + Axios
- Admin frontend отдельно (отдельный порт/домен, тот же API)
- Backend: Node.js + Express 5 + PostgreSQL + Sequelize 6 + Socket.IO
- Auth: Firebase token verification на backend
- Queue: BullMQ + Redis
- Security: Helmet, CORS whitelist, rate limit (Redis store)

Архитектурные требования:
- Раздели проект на client / admin-frontend / server
- Реализуй RBAC (user/admin)
- Все критичные операции БД только в транзакциях с rollback
- Любая ошибка в критичной операции логируется в audit log
- Единый формат ошибок API и safe-message для 5xx
- Публичные SEO-страницы в sitemap, приватные маршруты закрыть в robots
- Добавь unit + functional тесты для ключевых сценариев

Важно:
- Не копируй текущую бизнес-логику 1:1, создай новую доменную модель
- Сохрани инженерные принципы и качество реализации
```


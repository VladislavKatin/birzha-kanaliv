# ViewExchange / Youtoobe

YouTube Creator Marketplace - платформа для співпраці та обміну рекламою між креаторами.

## 🚀 Швидкий старт

### Windows
```bash
# Двічі клікніть на start.bat або запустіть:
start.bat
```

### Linux/Mac
```bash
chmod +x start.sh
./start.sh
```

## 📋 Вимоги

- Node.js 18+
- PostgreSQL 14+
- npm або yarn

## 🔧 Ручне налаштування

### 1. Створіть базу даних
```sql
CREATE DATABASE youtoobe;
```

### 2. Налаштуйте змінні оточення
```bash
cp server/.env.example server/.env
# Відредагуйте server/.env з вашими налаштуваннями
```

### 3. Встановіть залежності
```bash
npm run install:all
# або окремо:
cd client && npm install
cd server && npm install
```

### 4. Запустіть міграції та сіди
```bash
npm run setup
# або окремо:
npm run migrate
npm run seed
```

### 5. Запустіть сервери
```bash
npm run dev
# або окремо:
npm run dev:server  # Backend на :3001
npm run dev:client  # Frontend на :5173
```

## 📁 Структура проекту

```
youtoobe/
├── client/          # React (Vite) frontend
│   ├── src/
│   │   ├── components/   # Загальні компоненти
│   │   ├── context/      # React Context (Auth)
│   │   ├── pages/        # Сторінки
│   │   ├── services/     # API сервіси
│   │   └── styles/       # Глобальні стилі
│   └── package.json
│
├── server/          # Node.js (Express) backend
│   ├── config/          # Sequelize config
│   ├── middleware/      # Auth middleware
│   ├── migrations/      # DB міграції
│   ├── models/          # Sequelize моделі
│   ├── routes/          # API роути
│   ├── seeders/         # Demo дані
│   └── package.json
│
├── docs/            # Документація
├── start.bat        # Windows startup script
├── start.sh         # Linux/Mac startup script
└── package.json     # Кореневий package.json
```

## 🛠 Команди

| Команда | Опис |
|---------|------|
| `npm run dev` | Запустити обидва сервери |
| `npm run build` | Production build frontend |
| `npm run migrate` | Запустити міграції |
| `npm run migrate:undo` | Скасувати останню міграцію |
| `npm run seed` | Заповнити demo даними |
| `npm run seed:undo` | Видалити demo дані |
| `npm run setup` | Міграції + сіди разом |

## 👥 Demo користувачі

Після запуску `npm run seed` будуть створені:

| Email | Ім'я | План |
|-------|------|------|
| tech.creator@demo.com | Олександр Тех | Pro |
| gaming.master@demo.com | Максим Геймер | Free |
| travel.vlog@demo.com | Анна Мандрівниця | Pro |
| music.vibes@demo.com | Дмитро Музикант | Free |
| fitness.coach@demo.com | Катерина Фітнес | Agency |

## 🔐 Автентифікація

Проект використовує Firebase для автентифікації:
- Google Sign-In
- Email/Password

Налаштуйте Firebase credentials в:
- `client/src/firebase.js`
- `server/config/firebase-admin.json`

## 📄 Ліцензія

MIT

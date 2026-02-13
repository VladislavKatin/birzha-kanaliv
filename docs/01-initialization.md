# Етап 1: Ініціалізація проекту

## 🎯 Мета
Створити базову структуру проекту з React фронтендом та Node.js бекендом.

---

## 1.1 Створення React додатку (client)

### Команди
```bash
cd c:\www\youtoobe
npx create-vite@latest client --template react
cd client
npm install
```

### Встановлення залежностей
```bash
# Routing
npm install react-router-dom

# Firebase
npm install firebase

# HTTP клієнт
npm install axios

# Іконки (опціонально)
npm install lucide-react
```

### Структура client/src
```
src/
├── components/
│   ├── common/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Card.jsx
│   │   └── Modal.jsx
│   ├── layout/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   └── Footer.jsx
│   └── ui/
│       ├── Avatar.jsx
│       ├── Badge.jsx
│       └── Toast.jsx
├── pages/
│   ├── public/
│   │   ├── Home.jsx
│   │   ├── About.jsx
│   │   ├── Pricing.jsx
│   │   └── FAQ.jsx
│   ├── auth/
│   │   └── Auth.jsx
│   └── dashboard/
│       ├── Dashboard.jsx
│       ├── Profile.jsx
│       └── Settings.jsx
├── context/
│   └── AuthContext.jsx
├── services/
│   ├── api.js
│   └── firebase.js
├── hooks/
│   └── useAuth.js
├── styles/
│   ├── variables.css
│   ├── global.css
│   └── components/
└── utils/
    └── helpers.js
```

---

## 1.2 Створення Node.js бекенду (server)

### Команди
```bash
cd c:\www\youtoobe
mkdir server
cd server
npm init -y
```

### Встановлення залежностей
```bash
# Основні
npm install express cors dotenv

# База даних
npm install sequelize pg pg-hstore

# Firebase Admin
npm install firebase-admin

# Утиліти
npm install helmet morgan
```

### Dev залежності
```bash
npm install -D nodemon
```

### Структура server/
```
server/
├── config/
│   ├── database.js      # Sequelize конфіг
│   └── firebase.js      # Firebase Admin SDK
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── channelController.js
│   └── exchangeController.js
├── middleware/
│   ├── auth.js          # Firebase token verify
│   ├── errorHandler.js
│   └── validate.js
├── models/
│   ├── index.js
│   ├── User.js
│   ├── Channel.js
│   └── Exchange.js
├── routes/
│   ├── index.js
│   ├── authRoutes.js
│   ├── userRoutes.js
│   └── channelRoutes.js
├── services/
│   └── userService.js
├── app.js
├── server.js
├── .env.example
└── package.json
```

### Файл server/package.json
```json
{
  "name": "youtoobe-server",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "db:migrate": "npx sequelize-cli db:migrate",
    "db:seed": "npx sequelize-cli db:seed:all"
  }
}
```

---

## 1.3 Базові файли конфігурації

### server/.env.example
```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=youtoobe
DB_USER=postgres
DB_PASSWORD=your_password

# Firebase
FIREBASE_PROJECT_ID=viewexchange-3a790
FIREBASE_PRIVATE_KEY="..."
FIREBASE_CLIENT_EMAIL=...
```

### client/.env.example
```env
VITE_API_URL=http://localhost:3001/api
VITE_FIREBASE_API_KEY=AIzaSyCvXQGtjivj3p9uC5X4LLffY7sKrjw50Kg
VITE_FIREBASE_AUTH_DOMAIN=viewexchange-3a790.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=viewexchange-3a790
VITE_FIREBASE_STORAGE_BUCKET=viewexchange-3a790.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=608740325704
VITE_FIREBASE_APP_ID=1:608740325704:web:307ea9a0940f4e0ca75b7d
```

---

## 1.4 Міграція CSS

### Дії
1. Скопіювати `styles.css` з viewexchange → `client/src/styles/global.css`
2. Скопіювати специфічні CSS файли:
   - `auth.css` → `client/src/styles/auth.css`
   - `dashboard.css` → `client/src/styles/dashboard.css`
   - `marketplace.css` → `client/src/styles/marketplace.css`
   - і т.д.
3. Адаптувати як CSS Modules або імпортувати напряму

### CSS змінні (variables.css)
```css
:root {
  /* Colors - Ukrainian Theme */
  --color-primary: #0057B8;
  --color-accent: #FFD700;
  
  /* Gradients */
  --gradient-primary: linear-gradient(135deg, #0057B8 0%, #FFD700 100%);
  
  /* Neutrals */
  --color-bg: #ffffff;
  --color-text: #0f172a;
  --color-text-muted: #64748b;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  
  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 40px rgba(0, 0, 0, 0.15);
}
```

---

## ✅ Чеклист етапу

- [ ] Створено React додаток через Vite
- [ ] Встановлено React залежності (router, firebase, axios)
- [ ] Створено Node.js проект
- [ ] Встановлено Node.js залежності (express, sequelize, pg)
- [ ] Створено базову структуру папок
- [ ] Налаштовано .env файли
- [ ] Скопійовано та адаптовано CSS стилі

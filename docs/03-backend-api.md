# Етап 3: Backend API (Express + Sequelize)

## 🎯 Мета
Створити REST API для всіх операцій додатку.

---

## 3.1 Базовий сервер Express

### server/app.js
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

module.exports = app;
```

### server/server.js
```javascript
require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Sync models in development
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Models synchronized');
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();
```

---

## 3.2 Маршрути API

### server/routes/index.js
```javascript
const router = require('express').Router();

router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/channels', require('./channelRoutes'));
router.use('/exchanges', require('./exchangeRoutes'));
router.use('/messages', require('./messageRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/blog', require('./blogRoutes'));

module.exports = router;
```

---

## 3.3 Auth Routes & Controller

### server/routes/authRoutes.js
```javascript
const router = require('express').Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// POST /api/auth/register - Create/update user after Firebase auth
router.post('/register', verifyToken, authController.registerUser);

// GET /api/auth/me - Get current user profile
router.get('/me', verifyToken, authController.getCurrentUser);

// PUT /api/auth/profile - Update user profile
router.put('/profile', verifyToken, authController.updateProfile);

module.exports = router;
```

### server/controllers/authController.js
```javascript
const { User } = require('../models');

exports.registerUser = async (req, res, next) => {
  try {
    const { uid, email, displayName, photoURL } = req.firebaseUser;
    
    let user = await User.findOne({ where: { firebaseUid: uid } });
    
    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        email,
        displayName: displayName || email.split('@')[0],
        photoURL
      });
    }
    
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { firebaseUid: req.firebaseUser.uid },
      include: ['channels']
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Користувача не знайдено' });
    }
    
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { displayName, bio, country, language } = req.body;
    
    const user = await User.findOne({
      where: { firebaseUid: req.firebaseUser.uid }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Користувача не знайдено' });
    }
    
    await user.update({
      displayName,
      bio,
      country,
      language
    });
    
    res.json({ user });
  } catch (error) {
    next(error);
  }
};
```

---

## 3.4 Channel Routes & Controller

### server/routes/channelRoutes.js
```javascript
const router = require('express').Router();
const channelController = require('../controllers/channelController');
const { verifyToken, optionalAuth } = require('../middleware/auth');

// Публічні маршрути
router.get('/', optionalAuth, channelController.getChannels);
router.get('/:id', optionalAuth, channelController.getChannel);

// Захищені маршрути
router.post('/', verifyToken, channelController.createChannel);
router.put('/:id', verifyToken, channelController.updateChannel);
router.delete('/:id', verifyToken, channelController.deleteChannel);

module.exports = router;
```

### server/controllers/channelController.js
```javascript
const { Channel, User } = require('../models');
const { Op } = require('sequelize');

exports.getChannels = async (req, res, next) => {
  try {
    const {
      search,
      niche,
      country,
      language,
      contentType,
      minSubs,
      maxSubs,
      sort = 'popular',
      page = 1,
      limit = 12
    } = req.query;
    
    const where = { isActive: true };
    
    // Фільтри
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }
    if (niche) {
      where.niche = { [Op.overlap]: niche.split(',') };
    }
    if (country) {
      where.country = country;
    }
    if (language) {
      where.language = language;
    }
    if (contentType && contentType !== 'all') {
      where.contentType = contentType;
    }
    if (minSubs) {
      where.subscribers = { ...where.subscribers, [Op.gte]: parseInt(minSubs) };
    }
    if (maxSubs) {
      where.subscribers = { ...where.subscribers, [Op.lte]: parseInt(maxSubs) };
    }
    
    // Сортування
    const order = [];
    switch (sort) {
      case 'subscribers':
        order.push(['subscribers', 'DESC']);
        break;
      case 'views':
        order.push(['avgViews', 'DESC']);
        break;
      case 'newest':
        order.push(['createdAt', 'DESC']);
        break;
      default: // popular
        order.push(['subscribers', 'DESC'], ['avgViews', 'DESC']);
    }
    
    const offset = (page - 1) * limit;
    
    const { rows: channels, count } = await Channel.findAndCountAll({
      where,
      include: [{ model: User, as: 'owner', attributes: ['id', 'displayName', 'photoURL'] }],
      order,
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      channels,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getChannel = async (req, res, next) => {
  try {
    const channel = await Channel.findByPk(req.params.id, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'displayName', 'photoURL', 'bio'] }]
    });
    
    if (!channel) {
      return res.status(404).json({ error: 'Канал не знайдено' });
    }
    
    res.json({ channel });
  } catch (error) {
    next(error);
  }
};

exports.createChannel = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { firebaseUid: req.firebaseUser.uid } });
    
    if (!user) {
      return res.status(404).json({ error: 'Користувача не знайдено' });
    }
    
    const channel = await Channel.create({
      ...req.body,
      userId: user.id
    });
    
    res.status(201).json({ channel });
  } catch (error) {
    next(error);
  }
};

exports.updateChannel = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { firebaseUid: req.firebaseUser.uid } });
    const channel = await Channel.findByPk(req.params.id);
    
    if (!channel) {
      return res.status(404).json({ error: 'Канал не знайдено' });
    }
    
    if (channel.userId !== user.id) {
      return res.status(403).json({ error: 'Недостатньо прав' });
    }
    
    await channel.update(req.body);
    res.json({ channel });
  } catch (error) {
    next(error);
  }
};

exports.deleteChannel = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { firebaseUid: req.firebaseUser.uid } });
    const channel = await Channel.findByPk(req.params.id);
    
    if (!channel || channel.userId !== user.id) {
      return res.status(403).json({ error: 'Недостатньо прав' });
    }
    
    await channel.update({ isActive: false });
    res.json({ message: 'Канал видалено' });
  } catch (error) {
    next(error);
  }
};
```

---

## 3.5 Exchange Routes & Controller

### server/routes/exchangeRoutes.js
```javascript
const router = require('express').Router();
const exchangeController = require('../controllers/exchangeController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', exchangeController.getMyExchanges);
router.post('/', exchangeController.createExchange);
router.put('/:id/accept', exchangeController.acceptExchange);
router.put('/:id/reject', exchangeController.rejectExchange);
router.put('/:id/complete', exchangeController.completeExchange);

module.exports = router;
```

---

## 3.6 Firebase Auth Middleware

### server/middleware/auth.js
```javascript
const admin = require('../config/firebase');

exports.verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Необхідна авторизація' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.firebaseUser = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ error: 'Невалідний токен' });
  }
};

exports.optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.firebaseUser = decodedToken;
    } catch (error) {
      // Ignore invalid token for optional auth
    }
  }
  
  next();
};
```

### server/config/firebase.js
```javascript
const admin = require('firebase-admin');

const serviceAccount = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
```

---

## 3.7 Error Handler

### server/middleware/errorHandler.js
```javascript
module.exports = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Помилка валідації',
      details: err.errors.map(e => e.message)
    });
  }
  
  // Sequelize unique constraint
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      error: 'Запис з такими даними вже існує'
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Внутрішня помилка сервера'
  });
};
```

---

## 3.8 API Endpoints Summary

| Method | Endpoint | Опис | Auth |
|--------|----------|------|------|
| POST | `/api/auth/register` | Реєстрація після Firebase auth | ✅ |
| GET | `/api/auth/me` | Поточний користувач | ✅ |
| PUT | `/api/auth/profile` | Оновлення профілю | ✅ |
| GET | `/api/channels` | Список каналів (marketplace) | ❌ |
| GET | `/api/channels/:id` | Деталі каналу | ❌ |
| POST | `/api/channels` | Створення каналу | ✅ |
| PUT | `/api/channels/:id` | Оновлення каналу | ✅ |
| DELETE | `/api/channels/:id` | Видалення каналу | ✅ |
| GET | `/api/exchanges` | Мої обміни | ✅ |
| POST | `/api/exchanges` | Створення запиту | ✅ |
| PUT | `/api/exchanges/:id/accept` | Прийняти обмін | ✅ |
| PUT | `/api/exchanges/:id/reject` | Відхилити обмін | ✅ |
| GET | `/api/messages` | Мої повідомлення | ✅ |
| POST | `/api/messages` | Надіслати повідомлення | ✅ |
| GET | `/api/notifications` | Мої сповіщення | ✅ |
| PUT | `/api/notifications/:id/read` | Прочитати | ✅ |
| GET | `/api/blog` | Список статей | ❌ |
| GET | `/api/blog/:slug` | Стаття за slug | ❌ |

---

## ✅ Чеклист етапу

- [ ] Створено Express сервер (app.js, server.js)
- [ ] Налаштовано CORS, helmet, morgan
- [ ] Створено маршрути для всіх сутностей
- [ ] Реалізовано Firebase Auth middleware
- [ ] Реалізовано контролери: auth, channels, exchanges
- [ ] Реалізовано контролери: messages, notifications, blog
- [ ] Додано error handler
- [ ] Протестовано API через Postman/curl

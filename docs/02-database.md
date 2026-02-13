# Етап 2: База даних та моделі Sequelize

## 🎯 Мета
Створити PostgreSQL базу даних та Sequelize моделі для всіх сутностей проекту.

---

## 2.1 Створення бази даних PostgreSQL

### Команди (в pgAdmin або командний рядок)
```sql
CREATE DATABASE youtoobe;
CREATE USER youtoobe_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE youtoobe TO youtoobe_user;
```

---

## 2.2 Модель User (Користувач)

### server/models/User.js
```javascript
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    firebaseUid: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: { isEmail: true }
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    photoURL: {
      type: DataTypes.STRING,
      allowNull: true
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(2),  // ISO country code
      allowNull: true
    },
    language: {
      type: DataTypes.STRING(2),  // ISO language code
      defaultValue: 'uk'
    },
    role: {
      type: DataTypes.ENUM('creator', 'buyer', 'admin'),
      defaultValue: 'creator'
    },
    plan: {
      type: DataTypes.ENUM('free', 'pro', 'agency'),
      defaultValue: 'free'
    },
    planExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reputation: {
      type: DataTypes.DECIMAL(3, 1),
      defaultValue: 0.0
    },
    profileCompleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0  // percentage 0-100
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'users',
    timestamps: true
  });

  User.associate = (models) => {
    User.hasMany(models.Channel, { foreignKey: 'userId', as: 'channels' });
    User.hasMany(models.Exchange, { foreignKey: 'requesterId', as: 'sentExchanges' });
    User.hasMany(models.Exchange, { foreignKey: 'receiverId', as: 'receivedExchanges' });
    User.hasMany(models.Message, { foreignKey: 'senderId', as: 'sentMessages' });
    User.hasMany(models.Notification, { foreignKey: 'userId', as: 'notifications' });
  };

  return User;
};
```

---

## 2.3 Модель Channel (Канал)

### server/models/Channel.js
```javascript
module.exports = (sequelize, DataTypes) => {
  const Channel = sequelize.define('Channel', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    youtubeId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true
    },
    niche: {
      type: DataTypes.ARRAY(DataTypes.STRING),  // ['gaming', 'tech']
      defaultValue: []
    },
    country: {
      type: DataTypes.STRING(2),
      allowNull: true
    },
    language: {
      type: DataTypes.STRING(2),
      allowNull: true
    },
    contentType: {
      type: DataTypes.ENUM('shorts', 'long', 'mixed'),
      defaultValue: 'mixed'
    },
    subscribers: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    avgViews: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalViews: {
      type: DataTypes.BIGINT,
      defaultValue: 0
    },
    pricePerAd: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true  // ціна за рекламу
    },
    isExchangeOpen: {
      type: DataTypes.BOOLEAN,
      defaultValue: true  // чи відкритий до обмінів
    },
    isAdOpen: {
      type: DataTypes.BOOLEAN,
      defaultValue: true  // чи приймає рекламу
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'channels',
    timestamps: true
  });

  Channel.associate = (models) => {
    Channel.belongsTo(models.User, { foreignKey: 'userId', as: 'owner' });
    Channel.hasMany(models.Exchange, { foreignKey: 'requesterChannelId', as: 'sentExchanges' });
    Channel.hasMany(models.Exchange, { foreignKey: 'receiverChannelId', as: 'receivedExchanges' });
  };

  return Channel;
};
```

---

## 2.4 Модель Exchange (Обмін/Партнерство)

### server/models/Exchange.js
```javascript
module.exports = (sequelize, DataTypes) => {
  const Exchange = sequelize.define('Exchange', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    requesterId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    receiverId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    requesterChannelId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'channels', key: 'id' }
    },
    receiverChannelId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'channels', key: 'id' }
    },
    type: {
      type: DataTypes.ENUM('exchange', 'ad_purchase', 'collaboration'),
      defaultValue: 'exchange'
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'completed', 'cancelled'),
      defaultValue: 'pending'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true  // для платних розміщень
    },
    requesterCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    receiverCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'exchanges',
    timestamps: true
  });

  Exchange.associate = (models) => {
    Exchange.belongsTo(models.User, { foreignKey: 'requesterId', as: 'requester' });
    Exchange.belongsTo(models.User, { foreignKey: 'receiverId', as: 'receiver' });
    Exchange.belongsTo(models.Channel, { foreignKey: 'requesterChannelId', as: 'requesterChannel' });
    Exchange.belongsTo(models.Channel, { foreignKey: 'receiverChannelId', as: 'receiverChannel' });
  };

  return Exchange;
};
```

---

## 2.5 Модель Message (Повідомлення)

### server/models/Message.js
```javascript
module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    receiverId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    exchangeId: {
      type: DataTypes.UUID,
      allowNull: true,  // може бути прив'язане до обміну
      references: { model: 'exchanges', key: 'id' }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'messages',
    timestamps: true
  });

  Message.associate = (models) => {
    Message.belongsTo(models.User, { foreignKey: 'senderId', as: 'sender' });
    Message.belongsTo(models.User, { foreignKey: 'receiverId', as: 'receiver' });
    Message.belongsTo(models.Exchange, { foreignKey: 'exchangeId', as: 'exchange' });
  };

  return Message;
};
```

---

## 2.6 Модель Notification (Сповіщення)

### server/models/Notification.js
```javascript
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    type: {
      type: DataTypes.ENUM(
        'exchange_request',
        'exchange_accepted', 
        'exchange_rejected',
        'exchange_completed',
        'new_message',
        'profile_reminder',
        'system'
      ),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    relatedId: {
      type: DataTypes.UUID,
      allowNull: true  // ID пов'язаного об'єкту (exchange, message тощо)
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'notifications',
    timestamps: true
  });

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return Notification;
};
```

---

## 2.7 Модель BlogPost (Стаття блогу)

### server/models/BlogPost.js
```javascript
module.exports = (sequelize, DataTypes) => {
  const BlogPost = sequelize.define('BlogPost', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    slug: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    coverImage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    readTime: {
      type: DataTypes.INTEGER,  // хвилини
      defaultValue: 5
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'blog_posts',
    timestamps: true
  });

  return BlogPost;
};
```

---

## 2.8 Ініціалізація моделей

### server/models/index.js
```javascript
const { Sequelize } = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(config);

const User = require('./User')(sequelize, Sequelize.DataTypes);
const Channel = require('./Channel')(sequelize, Sequelize.DataTypes);
const Exchange = require('./Exchange')(sequelize, Sequelize.DataTypes);
const Message = require('./Message')(sequelize, Sequelize.DataTypes);
const Notification = require('./Notification')(sequelize, Sequelize.DataTypes);
const BlogPost = require('./BlogPost')(sequelize, Sequelize.DataTypes);

const models = { User, Channel, Exchange, Message, Notification, BlogPost };

// Run associations
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

module.exports = {
  sequelize,
  ...models
};
```

---

## ✅ Чеклист етапу

- [ ] Створено PostgreSQL базу даних
- [ ] Налаштовано підключення Sequelize
- [ ] Створено модель User
- [ ] Створено модель Channel
- [ ] Створено модель Exchange
- [ ] Створено модель Message
- [ ] Створено модель Notification
- [ ] Створено модель BlogPost
- [ ] Налаштовано асоціації між моделями
- [ ] Виконано синхронізацію/міграції

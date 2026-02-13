const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(config);

// ─── User ───────────────────────────────────────────
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  firebaseUid: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: { isEmail: true },
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  photoURL: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  languages: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  birthYear: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  gender: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  professionalRole: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  socialLinks: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  privacySettings: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  badges: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  notificationPrefs: {
    type: DataTypes.JSONB,
    defaultValue: { email_new_proposal: true, email_message: true, email_deal_complete: true, telegram: false, webpush: false },
  },
  role: {
    type: DataTypes.STRING(20),
    defaultValue: 'user',
    allowNull: false,
  },
}, {
  tableName: 'users',
  timestamps: true,
});

// ─── YouTubeAccount ─────────────────────────────────
const YouTubeAccount = sequelize.define('YouTubeAccount', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  channelId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  channelTitle: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  channelAvatar: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  subscribers: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  totalViews: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
  },
  totalVideos: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  avgViews30d: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  subGrowth30d: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  averageWatchTime: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  ctr: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  niche: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  language: {
    type: DataTypes.STRING(5),
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING(2),
    allowNull: true,
  },
  recentVideos: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  accessToken: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isFlagged: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  flagReason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  lastAnalyticsUpdate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  connectedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'youtube_accounts',
  timestamps: true,
});

// ─── TrafficOffer ───────────────────────────────────
const TrafficOffer = sequelize.define('TrafficOffer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  channelId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'youtube_accounts', key: 'id' },
  },
  type: {
    type: DataTypes.ENUM('subs', 'views'),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  niche: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  language: {
    type: DataTypes.STRING(5),
    allowNull: true,
  },
  minSubscribers: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  maxSubscribers: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('open', 'matched', 'completed'),
    defaultValue: 'open',
  },
}, {
  tableName: 'traffic_offers',
  timestamps: true,
});

// ─── TrafficMatch ───────────────────────────────────
const TrafficMatch = sequelize.define('TrafficMatch', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  offerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'traffic_offers', key: 'id' },
  },
  initiatorChannelId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'youtube_accounts', key: 'id' },
  },
  targetChannelId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'youtube_accounts', key: 'id' },
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'completed', 'rejected'),
    defaultValue: 'pending',
  },
  initiatorConfirmed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  targetConfirmed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'traffic_matches',
  timestamps: true,
});

// ─── Review ─────────────────────────────────────────
const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  matchId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'traffic_matches', key: 'id' },
  },
  fromChannelId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'youtube_accounts', key: 'id' },
  },
  toChannelId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'youtube_accounts', key: 'id' },
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 },
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'reviews',
  timestamps: true,
});

// ─── ChatRoom ───────────────────────────────────────
const ChatRoom = sequelize.define('ChatRoom', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  matchId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: { model: 'traffic_matches', key: 'id' },
  },
}, {
  tableName: 'chat_rooms',
  timestamps: true,
});

// ─── Message ────────────────────────────────────────
const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  chatRoomId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'chat_rooms', key: 'id' },
  },
  senderUserId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName: 'messages',
  timestamps: true,
});

// ─── ActionLog (anti-abuse) ─────────────────────────
const ActionLog = sequelize.define('ActionLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  details: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  ip: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'action_logs',
  timestamps: true,
});

// ─── Associations ───────────────────────────────────

// User <-> YouTubeAccount (1:many for future, 1:1 for MVP)
User.hasMany(YouTubeAccount, { foreignKey: 'userId', as: 'youtubeAccounts' });
User.hasOne(YouTubeAccount, { foreignKey: 'userId', as: 'youtubeAccount' });
YouTubeAccount.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

// YouTubeAccount <-> TrafficOffer
YouTubeAccount.hasMany(TrafficOffer, { foreignKey: 'channelId', as: 'offers' });
TrafficOffer.belongsTo(YouTubeAccount, { foreignKey: 'channelId', as: 'channel' });

// TrafficOffer <-> TrafficMatch
TrafficOffer.hasMany(TrafficMatch, { foreignKey: 'offerId', as: 'matches' });
TrafficMatch.belongsTo(TrafficOffer, { foreignKey: 'offerId', as: 'offer' });

// Channels in TrafficMatch
YouTubeAccount.hasMany(TrafficMatch, { foreignKey: 'initiatorChannelId', as: 'initiatedMatches' });
YouTubeAccount.hasMany(TrafficMatch, { foreignKey: 'targetChannelId', as: 'receivedMatches' });
TrafficMatch.belongsTo(YouTubeAccount, { foreignKey: 'initiatorChannelId', as: 'initiatorChannel' });
TrafficMatch.belongsTo(YouTubeAccount, { foreignKey: 'targetChannelId', as: 'targetChannel' });

// TrafficMatch <-> Review
TrafficMatch.hasMany(Review, { foreignKey: 'matchId', as: 'reviews' });
Review.belongsTo(TrafficMatch, { foreignKey: 'matchId', as: 'match' });

// Channels in Review
YouTubeAccount.hasMany(Review, { foreignKey: 'fromChannelId', as: 'givenReviews' });
YouTubeAccount.hasMany(Review, { foreignKey: 'toChannelId', as: 'receivedReviews' });
Review.belongsTo(YouTubeAccount, { foreignKey: 'fromChannelId', as: 'fromChannel' });
Review.belongsTo(YouTubeAccount, { foreignKey: 'toChannelId', as: 'toChannel' });

// TrafficMatch <-> ChatRoom
TrafficMatch.hasOne(ChatRoom, { foreignKey: 'matchId', as: 'chatRoom' });
ChatRoom.belongsTo(TrafficMatch, { foreignKey: 'matchId', as: 'match' });

// ChatRoom <-> Message
ChatRoom.hasMany(Message, { foreignKey: 'chatRoomId', as: 'messages' });
Message.belongsTo(ChatRoom, { foreignKey: 'chatRoomId', as: 'chatRoom' });

// User <-> Message
User.hasMany(Message, { foreignKey: 'senderUserId', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'senderUserId', as: 'sender' });

// User <-> ActionLog
User.hasMany(ActionLog, { foreignKey: 'userId', as: 'actionLogs' });
ActionLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  YouTubeAccount,
  TrafficOffer,
  TrafficMatch,
  Review,
  ChatRoom,
  Message,
  ActionLog,
};

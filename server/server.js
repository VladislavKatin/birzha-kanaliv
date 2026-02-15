require('dotenv').config();
const http = require('http');
const app = require('./app');
const { sequelize } = require('./models');
const setupSocket = require('./socketSetup');
const { initQueues } = require('./queues');
const { isRedisConnected } = require('./config/redis');
const { startTelegramBotPolling } = require('./services/telegramService');

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);
const io = setupSocket(server);
app.set('io', io);

async function fallbackAnalyticsRefresh() {
  try {
    const { refreshAllAnalytics } = require('./queues/tasks/refreshChannelStats');
    await refreshAllAnalytics();
  } catch (err) {
    console.error('Fallback analytics refresh error:', err.message);
  }
}

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('Database synced');
    }

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log('Socket.io ready');
    });

    initQueues();
    startTelegramBotPolling();

    if (!isRedisConnected()) {
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
      setInterval(fallbackAnalyticsRefresh, TWENTY_FOUR_HOURS);
      console.log('Analytics refresh scheduled via setInterval (fallback, every 24h)');
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

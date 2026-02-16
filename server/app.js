const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { getAllowedClientOrigins } = require('./config/clientOrigins');

const path = require('path');

const app = express();

const allowedOrigins = getAllowedClientOrigins();

function corsOriginValidator(origin, callback) {
    if (!origin) {
        // Allow non-browser requests (health checks, server-to-server)
        return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
        return callback(null, true);
    }

    const error = new Error(`CORS origin not allowed: ${origin}`);
    error.status = 403;
    return callback(error, false);
}

// Middleware
app.use(helmet());
app.use(cors({
    origin: corsOriginValidator,
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
    app.use('/api', apiLimiter);
    app.use('/api/auth', authLimiter);
}

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

module.exports = app;

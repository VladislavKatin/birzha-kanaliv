const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { getAllowedClientOrigins, normalizeOrigin } = require('./config/clientOrigins');
const requestId = require('./middleware/requestId');

const path = require('path');

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = getAllowedClientOrigins();
const corsOptions = {
    origin: corsOriginValidator,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

function corsOriginValidator(origin, callback) {
    if (!origin) {
        // Allow non-browser requests (health checks, server-to-server)
        return callback(null, true);
    }

    if (allowedOrigins.includes(normalizeOrigin(origin))) {
        return callback(null, true);
    }

    const error = new Error(`CORS origin not allowed: ${origin}`);
    error.status = 403;
    return callback(error, false);
}

// Middleware
app.use(helmet({
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
}));
app.use(requestId);
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
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

// Health checks
app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'birzha-kanaliv-api', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

module.exports = app;
module.exports.corsOptions = corsOptions;

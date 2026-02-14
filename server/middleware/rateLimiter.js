const rateLimit = require('express-rate-limit');

/**
 * Creates a rate limiter middleware.
 * Uses in-memory store by default. When Redis is available,
 * swap to `rate-limit-redis` store for distributed rate limiting.
 *
 * @param {Object} options
 * @param {number} [options.windowMs=15*60*1000] - Time window in ms
 * @param {number} [options.max=100] - Max requests per window
 * @param {string} [options.message] - Error message
 * @param {Function} [options.skip] - Skip callback
 * @returns {Function} Express middleware
 */
function createRateLimiter({
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests. Please try again later.',
    skip = () => false,
} = {}) {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: message },
        skip: (req) => req.method === 'OPTIONS' || skip(req),
        // When Redis is available, uncomment:
        // store: new RedisStore({ sendCommand: (...args) => redisClient.call(...args) }),
    });
}

function isLocalRequest(req) {
    const host = String(req.hostname || '').toLowerCase();
    const origin = String(req.headers.origin || '').toLowerCase();
    const ip = String(req.ip || '');
    const forwardedFor = String(req.headers['x-forwarded-for'] || '');
    return (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        ip === '127.0.0.1' ||
        ip === '::1' ||
        ip.endsWith(':127.0.0.1') ||
        forwardedFor.includes('127.0.0.1') ||
        forwardedFor.includes('::1')
    );
}

/**
 * Default API limiter: 100 requests per 15 minutes.
 * Excludes /api/auth/*, which has a dedicated auth limiter.
 */
const apiLimiter = createRateLimiter({
    skip: (req) => req.path.startsWith('/auth') || isLocalRequest(req),
});

/** Strict auth limiter: 10 requests per 15 minutes */
const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many auth attempts. Please try again in 15 minutes.',
    skip: (req) => isLocalRequest(req),
});

/** Upload limiter: 5 requests per 15 minutes */
const uploadLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many uploads. Please try again in 15 minutes.',
    skip: (req) => isLocalRequest(req),
});

module.exports = { apiLimiter, authLimiter, uploadLimiter, createRateLimiter };

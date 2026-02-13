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
 * @returns {Function} Express middleware
 */
function createRateLimiter({
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Забагато запитів. Спробуйте пізніше.',
} = {}) {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: message },
        // When Redis is available, uncomment:
        // store: new RedisStore({ sendCommand: (...args) => redisClient.call(...args) }),
    });
}

/** Default API limiter: 100 requests per 15 minutes */
const apiLimiter = createRateLimiter();

/** Strict auth limiter: 10 requests per 15 minutes */
const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Забагато спроб авторизації. Спробуйте через 15 хвилин.',
});

/** Upload limiter: 5 requests per 15 minutes */
const uploadLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Забагато завантажень. Спробуйте через 15 хвилин.',
});

module.exports = { apiLimiter, authLimiter, uploadLimiter, createRateLimiter };

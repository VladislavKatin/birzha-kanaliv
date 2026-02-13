const Redis = require('ioredis');

/**
 * Redis client with graceful fallback.
 * When REDIS_URL is not set or Redis is unavailable,
 * all operations silently return null / do nothing.
 *
 * @module config/redis
 */

let redis = null;
let isConnected = false;

const REDIS_URL = process.env.REDIS_URL;

if (REDIS_URL) {
    try {
        redis = new Redis(REDIS_URL, {
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                if (times > 3) {
                    console.warn('⚠️  Redis: max retries reached, giving up');
                    return null; // Stop retrying
                }
                return Math.min(times * 200, 2000);
            },
            lazyConnect: true,
        });

        redis.on('connect', () => {
            isConnected = true;
            console.log('✅ Redis connected');
        });

        redis.on('error', (err) => {
            if (isConnected) {
                console.warn('⚠️  Redis connection lost:', err.message);
            }
            isConnected = false;
        });

        redis.on('close', () => {
            isConnected = false;
        });

        // Attempt connection (non-blocking)
        redis.connect().catch((err) => {
            console.warn('⚠️  Redis not available — running without cache:', err.message);
            redis = null;
            isConnected = false;
        });
    } catch (err) {
        console.warn('⚠️  Redis init failed:', err.message);
        redis = null;
    }
} else {
    console.log('ℹ️  REDIS_URL not set — running without Redis');
}

/**
 * Get the Redis client (may be null if unavailable).
 * @returns {Redis|null}
 */
function getRedis() {
    return isConnected ? redis : null;
}

/**
 * Check if Redis is currently connected.
 * @returns {boolean}
 */
function isRedisConnected() {
    return isConnected;
}

module.exports = { getRedis, isRedisConnected };

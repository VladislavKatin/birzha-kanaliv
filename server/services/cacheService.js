const { getRedis } = require('../config/redis');

/**
 * Cache service with Redis + in-memory fallback.
 * When Redis is unavailable, uses a simple Map with TTL eviction.
 *
 * @module services/cacheService
 */

// In-memory fallback store
const memoryCache = new Map();
const memoryCacheTTLs = new Map();

/**
 * Get a cached value or compute and cache it.
 *
 * @param {string} key - Cache key
 * @param {number} ttlSeconds - Time-to-live in seconds
 * @param {Function} fetchFn - Async function that produces the value if cache miss
 * @returns {Promise<any>} Cached or freshly computed value
 */
async function getOrSet(key, ttlSeconds, fetchFn) {
    // Try Redis first
    const redis = getRedis();
    if (redis) {
        try {
            const cached = await redis.get(key);
            if (cached !== null) {
                return JSON.parse(cached);
            }
            const value = await fetchFn();
            await redis.setex(key, ttlSeconds, JSON.stringify(value));
            return value;
        } catch (err) {
            console.warn(`Cache error for key "${key}":`, err.message);
        }
    }

    // Fallback: in-memory cache with TTL
    const now = Date.now();
    const ttlEntry = memoryCacheTTLs.get(key);
    if (ttlEntry && ttlEntry > now && memoryCache.has(key)) {
        return memoryCache.get(key);
    }

    const value = await fetchFn();
    memoryCache.set(key, value);
    memoryCacheTTLs.set(key, now + ttlSeconds * 1000);

    // Cleanup old entries every 100 sets (prevent memory leak)
    if (memoryCache.size > 200) {
        for (const [k, expiry] of memoryCacheTTLs) {
            if (expiry < now) {
                memoryCache.delete(k);
                memoryCacheTTLs.delete(k);
            }
        }
    }

    return value;
}

/**
 * Invalidate a cache key.
 * @param {string} key
 */
async function invalidate(key) {
    const redis = getRedis();
    if (redis) {
        try { await redis.del(key); } catch (_) { /* ignore */ }
    }
    memoryCache.delete(key);
    memoryCacheTTLs.delete(key);
}

/**
 * Invalidate all keys matching a pattern.
 * @param {string} pattern - e.g. 'channel:*'
 */
async function invalidatePattern(pattern) {
    const redis = getRedis();
    if (redis) {
        try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) await redis.del(...keys);
        } catch (_) { /* ignore */ }
    }

    // For memory cache, match with simple glob
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of memoryCache.keys()) {
        if (regex.test(key)) {
            memoryCache.delete(key);
            memoryCacheTTLs.delete(key);
        }
    }
}

module.exports = { getOrSet, invalidate, invalidatePattern };

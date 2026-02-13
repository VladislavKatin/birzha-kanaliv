const { Queue, Worker } = require('bullmq');
const { isRedisConnected } = require('../config/redis');

/**
 * Bull queues with graceful Redis fallback.
 * When Redis is unavailable, queues are not created and
 * tasks fall back to direct execution (synchronous).
 *
 * @module queues/index
 */

let refreshChannelStatsQueue = null;
let publishReviewsQueue = null;
let exportUserDataQueue = null;

const REDIS_URL = process.env.REDIS_URL;

/**
 * Initialize all Bull queues.
 * Safe to call even without Redis — silently skips setup.
 */
function initQueues() {
    if (!REDIS_URL) {
        console.log('ℹ️  Bull queues disabled — REDIS_URL not set');
        return;
    }

    const connection = { url: REDIS_URL };

    try {
        // ── Queue 1: Refresh channel stats (cron: every 24h) ──
        refreshChannelStatsQueue = new Queue('refresh-channel-stats', { connection });

        new Worker('refresh-channel-stats', async (job) => {
            console.log('🔄 [Queue] Refreshing channel stats...');
            const { refreshAllAnalytics } = require('./tasks/refreshChannelStats');
            await refreshAllAnalytics();
            console.log('✅ [Queue] Channel stats refresh complete');
        }, { connection, concurrency: 1 });

        // Add repeatable job (every 24 hours)
        refreshChannelStatsQueue.add('refresh', {}, {
            repeat: { every: 24 * 60 * 60 * 1000 },
            removeOnComplete: 10,
            removeOnFail: 5,
        });

        // ── Queue 2: Publish reviews after 7 days ──
        publishReviewsQueue = new Queue('publish-reviews', { connection });

        new Worker('publish-reviews', async (job) => {
            console.log('📝 [Queue] Publishing due reviews...');
            const { publishDueReviews } = require('./tasks/publishReviews');
            await publishDueReviews();
            console.log('✅ [Queue] Reviews published');
        }, { connection, concurrency: 1 });

        publishReviewsQueue.add('publish', {}, {
            repeat: { every: 60 * 60 * 1000 }, // Every hour
            removeOnComplete: 10,
            removeOnFail: 5,
        });

        // ── Queue 3: Export user data (on-demand) ──
        exportUserDataQueue = new Queue('export-user-data', { connection });

        new Worker('export-user-data', async (job) => {
            console.log(`📦 [Queue] Exporting data for user ${job.data.userId}...`);
            const { exportData } = require('./tasks/exportUserData');
            await exportData(job.data.userId);
            console.log(`✅ [Queue] Export complete for user ${job.data.userId}`);
        }, { connection, concurrency: 2 });

        console.log('✅ Bull queues initialized (3 queues)');
    } catch (err) {
        console.warn('⚠️  Bull queues init failed:', err.message);
    }
}

/**
 * Add a user data export job to the queue (or run synchronously if no Redis).
 * @param {string} userId
 */
async function enqueueExportUserData(userId) {
    if (exportUserDataQueue) {
        await exportUserDataQueue.add('export', { userId }, {
            removeOnComplete: 5,
            removeOnFail: 3,
        });
        return { queued: true };
    }
    // Fallback: synchronous execution
    const { exportData } = require('./tasks/exportUserData');
    return exportData(userId);
}

module.exports = {
    initQueues,
    enqueueExportUserData,
    getRefreshQueue: () => refreshChannelStatsQueue,
    getPublishReviewsQueue: () => publishReviewsQueue,
    getExportQueue: () => exportUserDataQueue,
};

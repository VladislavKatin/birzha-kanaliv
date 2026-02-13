const { YouTubeAccount } = require('../../models');
const { Op } = require('sequelize');

/**
 * Refresh channel stats for all connected YouTube accounts.
 * Extracted from server.js for use as a Bull queue task.
 *
 * @async
 */
async function refreshAllAnalytics() {
    let youtubeService;
    try {
        youtubeService = require('../../services/youtubeService');
    } catch (err) {
        console.error('❌ youtubeService not available:', err.message);
        return;
    }

    const accounts = await YouTubeAccount.findAll({
        where: { refreshToken: { [Op.ne]: null } },
    });

    console.log(`🔄 Processing ${accounts.length} channels...`);

    for (const account of accounts) {
        try {
            const { accessToken } = await youtubeService.refreshAccessToken(account.refreshToken);
            const channelInfo = await youtubeService.getMyChannel(accessToken);
            const analytics = await youtubeService.getChannelAnalytics(accessToken, account.channelId);
            const recentVideos = await youtubeService.getRecentVideos(accessToken, account.channelId, 10);

            const previousSubs = account.subscribers;
            const isAnomalous = youtubeService.detectAnomalousGrowth(
                channelInfo?.subscribers || 0,
                previousSubs
            );

            await account.update({
                accessToken,
                subscribers: channelInfo?.subscribers || account.subscribers,
                totalViews: channelInfo?.totalViews || account.totalViews,
                totalVideos: channelInfo?.totalVideos || account.totalVideos,
                avgViews30d: analytics.avgViews30d,
                subGrowth30d: analytics.subGrowth30d,
                averageWatchTime: analytics.averageWatchTime,
                ctr: analytics.ctr,
                recentVideos,
                lastAnalyticsUpdate: new Date(),
                isFlagged: isAnomalous ? true : account.isFlagged,
                flagReason: isAnomalous ? 'Аномальний ріст підписників' : account.flagReason,
            });

            console.log(`  ✅ Updated: ${account.channelTitle}`);
        } catch (err) {
            console.error(`  ❌ Failed: ${account.channelTitle}:`, err.message);
        }
    }
}

module.exports = { refreshAllAnalytics };

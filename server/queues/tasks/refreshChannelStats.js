const { Op } = require('sequelize');
const { sequelize, YouTubeAccount, ActionLog } = require('../../models');
const { encryptToken, decryptToken } = require('../../services/tokenCryptoService');

const AUTO_ANOMALY_FLAG_REASON = 'Аномальний ріст підписників';

/**
 * Refresh channel analytics for all connected accounts.
 * This task does not auto-flag channels; it only records anomaly events.
 * Legacy auto-flags are removed during refresh.
 */
async function refreshAllAnalytics() {
    let youtubeService;
    try {
        youtubeService = require('../../services/youtubeService');
    } catch (err) {
        console.error('youtubeService not available:', err.message);
        return;
    }

    const accounts = await YouTubeAccount.findAll({
        where: { refreshToken: { [Op.ne]: null } },
    });

    console.log(`Processing ${accounts.length} channels...`);

    for (const account of accounts) {
        try {
            const tokenSource = account.refreshToken ? decryptToken(account.refreshToken) : null;
            const { accessToken } = await youtubeService.refreshAccessToken(tokenSource);
            const channelInfo = await youtubeService.getMyChannel(accessToken);
            const analytics = await youtubeService.getChannelAnalytics(accessToken, account.channelId);
            const recentVideos = await youtubeService.getRecentVideos(accessToken, account.channelId, 10);

            const previousSubs = account.subscribers;
            const currentSubscribers = channelInfo?.subscribers || 0;
            const isAnomalous = youtubeService.detectAnomalousGrowth(currentSubscribers, previousSubs);
            const wasAutoFlagged = account.isFlagged && account.flagReason === AUTO_ANOMALY_FLAG_REASON;

            await sequelize.transaction(async (transaction) => {
                await account.update({
                    accessToken: encryptToken(accessToken),
                    subscribers: channelInfo?.subscribers || account.subscribers,
                    totalViews: channelInfo?.totalViews || account.totalViews,
                    totalVideos: channelInfo?.totalVideos || account.totalVideos,
                    avgViews30d: analytics.avgViews30d,
                    subGrowth30d: analytics.subGrowth30d,
                    averageWatchTime: analytics.averageWatchTime,
                    ctr: analytics.ctr,
                    recentVideos,
                    lastAnalyticsUpdate: new Date(),
                    isFlagged: wasAutoFlagged ? false : account.isFlagged,
                    flagReason: wasAutoFlagged ? null : account.flagReason,
                }, { transaction });

                if (isAnomalous) {
                    await ActionLog.create({
                        userId: account.userId,
                        action: 'analytics_anomaly_detected',
                        details: {
                            channelId: account.channelId,
                            previousSubscribers: previousSubs,
                            currentSubscribers,
                            source: 'scheduled_refresh',
                        },
                        ip: null,
                    }, { transaction });
                }
            });

            console.log(`Updated: ${account.channelTitle}`);
        } catch (err) {
            console.error(`Failed: ${account.channelTitle}:`, err.message);
        }
    }
}

module.exports = { refreshAllAnalytics };

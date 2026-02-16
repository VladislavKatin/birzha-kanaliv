const router = require('express').Router();
const { sequelize, User, YouTubeAccount, TrafficOffer, ActionLog } = require('../models');
const auth = require('../middleware/auth');
const youtubeService = require('../services/youtubeService');
const { logInfo, logWarn, logError } = require('../services/logger');
const { ensureAutoOffersForChannels } = require('../services/autoOfferService');
const { resolveClientRedirectUrl } = require('../config/clientOrigins');

function serializeState(payload) {
    return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function deserializeState(rawState) {
    if (!rawState) return { firebaseUid: null, redirectOrigin: null };

    try {
        const parsed = JSON.parse(Buffer.from(rawState, 'base64url').toString('utf8'));
        return {
            firebaseUid: parsed?.firebaseUid || null,
            redirectOrigin: parsed?.redirectOrigin || null,
        };
    } catch {
        return { firebaseUid: rawState, redirectOrigin: null };
    }
}

/**
 * @route GET /api/youtube/connect
 * @description Generate YouTube OAuth URL for channel connection
 * @access Private
 * @returns {Object} authUrl - Google OAuth authorization URL
 */
router.get('/connect', auth, async (req, res) => {
    try {
        const firebaseUid = req.firebaseUser.uid;
        const redirectOrigin = req.headers.origin || null;
        const { email, name, picture } = req.firebaseUser;

        await sequelize.transaction(async (transaction) => {
            let user = await User.findOne({
                where: { firebaseUid },
                transaction,
            });

            if (!user) {
                if (!email) {
                    throw new Error('Missing email in auth payload');
                }

                user = await User.create({
                    firebaseUid,
                    email,
                    displayName: name || email.split('@')[0],
                    photoURL: picture || null,
                }, { transaction });

                await ActionLog.create({
                    userId: user.id,
                    action: 'user_auto_created_for_youtube_connect',
                    details: { firebaseUid },
                    ip: req.ip,
                }, { transaction });
            }

            await ActionLog.create({
                userId: user.id,
                action: 'youtube_connect_started',
                details: { firebaseUid },
                ip: req.ip,
            }, { transaction });
        });

        const state = serializeState({ firebaseUid, redirectOrigin });
        const authUrl = youtubeService.getAuthUrl(state);
        logInfo('youtube.connect.url.generated', { firebaseUid, redirectOrigin });
        res.json({ authUrl });
    } catch (error) {
        logError('youtube.connect.url.failed', { firebaseUid: req.firebaseUser?.uid || null, error });
        res.status(500).json({ error: 'Failed to generate auth URL' });
    }
});

/**
 * @route GET /api/youtube/callback
 * @description Handle Google OAuth callback - exchange code for tokens, save channel
 * @access Public (state param carries firebase UID)
 * @param {string} code - OAuth authorization code
 * @param {string} state - Firebase UID for user association
 * @returns {Redirect} Redirects to /dashboard?youtube=connected|error
 */
router.get('/callback', async (req, res) => {
    try {
        const { code, state } = req.query;
        const decodedState = deserializeState(state);
        const firebaseUid = decodedState.firebaseUid;
        const clientUrl = resolveClientRedirectUrl(decodedState.redirectOrigin);
        logInfo('youtube.callback.request', {
            firebaseUid: firebaseUid || null,
            redirectOrigin: decodedState.redirectOrigin || null,
        });

        if (!code || !firebaseUid) {
            return res.redirect(`${clientUrl}/dashboard?youtube=error`);
        }

        // Exchange code for tokens
        const tokens = await youtubeService.exchangeCodeForTokens(code);

        // Get channel info
        const channelInfo = await youtubeService.getMyChannel(tokens.accessToken);
        if (!channelInfo) {
            return res.status(400).json({ error: 'No YouTube channel found for this account' });
        }

        // Find user by firebase UID (state = firebase uid)
        const user = await User.findOne({ where: { firebaseUid } });
        if (!user) {
            return res.redirect(`${clientUrl}/dashboard?youtube=error`);
        }

        // Check if channel already connected by another user
        const existingAccount = await YouTubeAccount.findOne({
            where: { channelId: channelInfo.channelId },
        });

        if (existingAccount && existingAccount.userId !== user.id) {
            return res.status(409).json({ error: 'This channel is already connected by another user' });
        }

        // Get analytics
        let analytics = { avgViews30d: 0, subGrowth30d: 0, averageWatchTime: 0, ctr: 0 };
        try {
            analytics = await youtubeService.getChannelAnalytics(tokens.accessToken, channelInfo.channelId);
        } catch (e) {
            logWarn('youtube.callback.analytics.partial_failure', {
                firebaseUid,
                channelId: channelInfo.channelId,
                error: e,
            });
        }

        // Get recent videos
        let recentVideos = [];
        try {
            recentVideos = await youtubeService.getRecentVideos(tokens.accessToken, channelInfo.channelId, 10);
        } catch (e) {
            logWarn('youtube.callback.videos.partial_failure', {
                firebaseUid,
                channelId: channelInfo.channelId,
                error: e,
            });
        }

        // Upsert YouTube account
        const accountData = {
            userId: user.id,
            channelId: channelInfo.channelId,
            channelTitle: channelInfo.channelTitle,
            channelAvatar: channelInfo.channelAvatar,
            description: channelInfo.description,
            country: channelInfo.country,
            subscribers: channelInfo.subscribers,
            totalViews: channelInfo.totalViews,
            totalVideos: channelInfo.totalVideos,
            avgViews30d: analytics.avgViews30d,
            subGrowth30d: analytics.subGrowth30d,
            averageWatchTime: analytics.averageWatchTime,
            ctr: analytics.ctr,
            recentVideos,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            lastAnalyticsUpdate: new Date(),
            connectedAt: new Date(),
        };

        let account;
        if (existingAccount) {
            await existingAccount.update(accountData);
            account = existingAccount;
        } else {
            account = await YouTubeAccount.create(accountData);
        }

        // Log action
        await ActionLog.create({
            userId: user.id,
            action: 'youtube_connect',
            details: { channelId: channelInfo.channelId, channelTitle: channelInfo.channelTitle },
            ip: req.ip,
        });

        await ensureAutoOffersForChannels({
            sequelize,
            YouTubeAccount,
            TrafficOffer,
            ActionLog,
            channelIds: [account.id],
            reason: 'youtube_connected',
        });

        // Redirect to client dashboard
        logInfo('youtube.callback.success', {
            firebaseUid,
            userId: user.id,
            channelId: channelInfo.channelId,
            reusedExistingAccount: !!existingAccount,
        });
        res.redirect(`${clientUrl}/dashboard?youtube=connected`);
    } catch (error) {
        const decodedState = deserializeState(req.query?.state);
        logError('youtube.callback.failed', {
            firebaseUid: decodedState.firebaseUid || null,
            error,
        });
        const clientUrl = resolveClientRedirectUrl(decodedState.redirectOrigin);
        res.redirect(`${clientUrl}/dashboard?youtube=error`);
    }
});

/**
 * @route GET /api/youtube/analytics
 * @description Get stored analytics for user's connected channel
 * @access Private
 * @returns {Object} channel (stats, flags, timestamps), recentVideos[]
 */
router.get('/analytics', auth, async (req, res) => {
    try {
        const user = await User.findOne({ where: { firebaseUid: req.firebaseUser.uid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const account = await YouTubeAccount.findOne({ where: { userId: user.id } });
        if (!account) return res.status(404).json({ error: 'No YouTube channel connected' });

        res.json({
            channel: {
                channelId: account.channelId,
                channelTitle: account.channelTitle,
                channelAvatar: account.channelAvatar,
                subscribers: account.subscribers,
                totalViews: account.totalViews,
                totalVideos: account.totalVideos,
                avgViews30d: account.avgViews30d,
                subGrowth30d: account.subGrowth30d,
                averageWatchTime: account.averageWatchTime,
                ctr: account.ctr,
                niche: account.niche,
                language: account.language,
                country: account.country,
                isFlagged: account.isFlagged,
                flagReason: account.flagReason,
                lastAnalyticsUpdate: account.lastAnalyticsUpdate,
                connectedAt: account.connectedAt,
            },
            recentVideos: account.recentVideos || [],
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ error: 'Failed to get analytics' });
    }
});

/**
 * @route POST /api/youtube/refresh
 * @description Manually refresh channel analytics from YouTube API. Detects anomalous growth.
 * @access Private
 * @returns {Object} message, flagged (boolean if anomalous growth detected)
 */
router.post('/refresh', auth, async (req, res) => {
    try {
        const user = await User.findOne({ where: { firebaseUid: req.firebaseUser.uid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const account = await YouTubeAccount.findOne({ where: { userId: user.id } });
        if (!account) return res.status(404).json({ error: 'No YouTube channel connected' });

        // Refresh access token if needed
        let accessToken = account.accessToken;
        try {
            const refreshed = await youtubeService.refreshAccessToken(account.refreshToken);
            accessToken = refreshed.accessToken;
            await account.update({ accessToken });
        } catch (e) {
            logWarn('youtube.refresh.token.partial_failure', {
                userId: user.id,
                channelId: account.channelId,
                error: e,
            });
        }

        // Fetch fresh data
        const channelInfo = await youtubeService.getMyChannel(accessToken);
        const analytics = await youtubeService.getChannelAnalytics(accessToken, account.channelId);
        const recentVideos = await youtubeService.getRecentVideos(accessToken, account.channelId, 10);

        // Anti-abuse: detect anomalous growth
        const previousSubs = account.subscribers;
        const isAnomalous = youtubeService.detectAnomalousGrowth(
            channelInfo?.subscribers || 0,
            previousSubs
        );

        await account.update({
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

        // Log action
        await ActionLog.create({
            userId: user.id,
            action: 'analytics_refresh',
            details: { channelId: account.channelId, anomalous: isAnomalous },
            ip: req.ip,
        });

        res.json({ message: 'Analytics refreshed', flagged: isAnomalous });
        logInfo('youtube.refresh.success', {
            userId: user.id,
            channelId: account.channelId,
            flagged: isAnomalous,
        });
    } catch (error) {
        logError('youtube.refresh.failed', {
            firebaseUid: req.firebaseUser?.uid || null,
            error,
        });
        res.status(500).json({ error: 'Failed to refresh analytics' });
    }
});

/**
 * @route PUT /api/youtube/profile
 * @description Update channel niche and language settings
 * @access Private
 * @param {string} [niche] - Channel content niche
 * @param {string} [language] - Channel language
 * @returns {Object} message
 */
router.put('/profile', auth, async (req, res) => {
    try {
        const { niche, language } = req.body;
        const user = await User.findOne({ where: { firebaseUid: req.firebaseUser.uid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const account = await YouTubeAccount.findOne({ where: { userId: user.id } });
        if (!account) return res.status(404).json({ error: 'No YouTube channel connected' });

        await account.update({
            niche: niche || account.niche,
            language: language || account.language,
        });

        res.json({ message: 'Profile updated' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

module.exports = router;


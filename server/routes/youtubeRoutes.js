const router = require('express').Router();
const { User, YouTubeAccount, ActionLog } = require('../models');
const auth = require('../middleware/auth');
const youtubeService = require('../services/youtubeService');

/**
 * @route GET /api/youtube/connect
 * @description Generate YouTube OAuth URL for channel connection
 * @access Private
 * @returns {Object} authUrl - Google OAuth authorization URL
 */
router.get('/connect', auth, (req, res) => {
    try {
        const state = req.firebaseUser.uid;
        const authUrl = youtubeService.getAuthUrl(state);
        res.json({ authUrl });
    } catch (error) {
        console.error('YouTube connect error:', error);
        res.status(500).json({ error: 'Failed to generate auth URL' });
    }
});

/**
 * @route GET /api/youtube/callback
 * @description Handle Google OAuth callback — exchange code for tokens, save channel
 * @access Public (state param carries firebase UID)
 * @param {string} code - OAuth authorization code
 * @param {string} state - Firebase UID for user association
 * @returns {Redirect} Redirects to /dashboard?youtube=connected|error
 */
router.get('/callback', async (req, res) => {
    try {
        const { code, state } = req.query;

        if (!code || !state) {
            return res.status(400).json({ error: 'Missing code or state' });
        }

        // Exchange code for tokens
        const tokens = await youtubeService.exchangeCodeForTokens(code);

        // Get channel info
        const channelInfo = await youtubeService.getMyChannel(tokens.accessToken);
        if (!channelInfo) {
            return res.status(400).json({ error: 'No YouTube channel found for this account' });
        }

        // Find user by firebase UID (state = firebase uid)
        const user = await User.findOne({ where: { firebaseUid: state } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
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
            console.warn('Could not fetch analytics during connect:', e.message);
        }

        // Get recent videos
        let recentVideos = [];
        try {
            recentVideos = await youtubeService.getRecentVideos(tokens.accessToken, channelInfo.channelId, 10);
        } catch (e) {
            console.warn('Could not fetch videos during connect:', e.message);
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

        // Redirect to client dashboard
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        res.redirect(`${clientUrl}/dashboard?youtube=connected`);
    } catch (error) {
        console.error('YouTube callback error:', error);
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
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
            console.warn('Token refresh failed, using existing token:', e.message);
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
    } catch (error) {
        console.error('Refresh analytics error:', error);
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

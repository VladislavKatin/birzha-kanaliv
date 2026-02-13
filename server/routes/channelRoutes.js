const router = require('express').Router();
const { YouTubeAccount, Review, User, TrafficMatch, TrafficOffer } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');

/**
 * @route GET /api/channels
 * @description List all public channels with optional niche/language/subscriber filters
 * @access Public
 * @param {string} [niche] - Filter by niche
 * @param {string} [language] - Filter by language
 * @param {number} [minSubs] - Minimum subscribers
 * @param {number} [maxSubs] - Maximum subscribers
 * @param {number} [page=1] - Page number
 * @param {number} [limit=20] - Items per page
 * @returns {Object} channels[], pagination
 */
router.get('/', async (req, res) => {
    try {
        const { niche, language, minSubs, maxSubs, page = 1, limit = 20 } = req.query;
        const where = { isFlagged: false };

        if (niche) where.niche = niche;
        if (language) where.language = language;
        if (minSubs) where.subscribers = { ...where.subscribers, [Op.gte]: parseInt(minSubs) };
        if (maxSubs) where.subscribers = { ...where.subscribers, [Op.lte]: parseInt(maxSubs) };

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows: channels } = await YouTubeAccount.findAndCountAll({
            where,
            attributes: [
                'id', 'channelId', 'channelTitle', 'channelAvatar', 'description',
                'subscribers', 'totalViews', 'totalVideos', 'avgViews30d', 'subGrowth30d',
                'niche', 'language', 'country', 'verified', 'isActive', 'connectedAt',
            ],
            order: [['subscribers', 'DESC']],
            limit: parseInt(limit),
            offset,
        });

        res.json({
            channels,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error('List channels error:', error);
        res.status(500).json({ error: 'Failed to list channels' });
    }
});

/**
 * @route GET /api/channels/my
 * @description Get current user's connected YouTube channels
 * @access Private
 * @returns {Object} channels[]
 */
router.get('/my', auth, async (req, res) => {
    try {
        const user = await User.findOne({ where: { firebaseUid: req.firebaseUser.uid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const channels = await YouTubeAccount.findAll({ where: { userId: user.id } });
        res.json({ channels });
    } catch (error) {
        console.error('Get my channels error:', error);
        res.status(500).json({ error: 'Failed to get channels' });
    }
});

/**
 * @route GET /api/channels/:id
 * @description Get channel profile with reviews, avg rating, and swap history
 * @access Public
 * @param {string} id - Channel UUID
 * @returns {Object} channel, reviews[], rating, swapHistory[]
 */
router.get('/:id', async (req, res) => {
    try {
        const channel = await YouTubeAccount.findByPk(req.params.id, {
            attributes: [
                'id', 'channelId', 'channelTitle', 'channelAvatar', 'description',
                'subscribers', 'totalViews', 'totalVideos', 'avgViews30d', 'subGrowth30d',
                'averageWatchTime', 'ctr', 'niche', 'language', 'country',
                'recentVideos', 'isFlagged', 'verified', 'isActive', 'connectedAt',
                'lastAnalyticsUpdate',
            ],
        });

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        // Get reviews for this channel
        const reviews = await Review.findAll({
            where: { toChannelId: channel.id },
            include: [
                {
                    model: YouTubeAccount,
                    as: 'fromChannel',
                    attributes: ['channelTitle', 'channelAvatar'],
                },
            ],
            order: [['createdAt', 'DESC']],
            limit: 20,
        });

        // Calculate average rating
        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        // Get swap history for this channel
        const swapHistory = await TrafficMatch.findAll({
            where: {
                [Op.or]: [
                    { initiatorChannelId: channel.id },
                    { targetChannelId: channel.id },
                ],
                status: 'completed',
            },
            include: [
                { model: YouTubeAccount, as: 'initiatorChannel', attributes: ['channelTitle', 'channelAvatar', 'subscribers'] },
                { model: YouTubeAccount, as: 'targetChannel', attributes: ['channelTitle', 'channelAvatar', 'subscribers'] },
                { model: TrafficOffer, as: 'offer', attributes: ['type', 'description'] },
            ],
            order: [['completedAt', 'DESC']],
            limit: 10,
        });

        res.json({
            channel,
            reviews,
            rating: {
                average: Math.round(avgRating * 10) / 10,
                count: reviews.length,
            },
            swapHistory,
        });
    } catch (error) {
        console.error('Get channel error:', error);
        res.status(500).json({ error: 'Failed to get channel' });
    }
});

/**
 * @route PUT /api/channels/:id
 * @description Update channel settings (toggle isActive)
 * @access Private (channel owner only)
 * @param {string} id - Channel UUID
 * @param {boolean} [isActive] - Toggle channel visibility
 * @returns {Object} channel
 */
router.put('/:id', auth, async (req, res) => {
    try {
        const user = await User.findOne({ where: { firebaseUid: req.firebaseUser.uid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const channel = await YouTubeAccount.findByPk(req.params.id);
        if (!channel) return res.status(404).json({ error: 'Channel not found' });
        if (channel.userId !== user.id) return res.status(403).json({ error: 'Not your channel' });

        const { isActive } = req.body;
        if (typeof isActive === 'boolean') {
            await channel.update({ isActive });
        }

        res.json({ channel });
    } catch (error) {
        console.error('Update channel error:', error);
        res.status(500).json({ error: 'Failed to update channel' });
    }
});

/**
 * @route DELETE /api/channels/:id
 * @description Delete a channel (owner only)
 * @access Private (channel owner only)
 * @param {string} id - Channel UUID
 * @returns {Object} message
 */
router.delete('/:id', auth, async (req, res) => {
    try {
        const user = await User.findOne({ where: { firebaseUid: req.firebaseUser.uid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const channel = await YouTubeAccount.findByPk(req.params.id);
        if (!channel) return res.status(404).json({ error: 'Channel not found' });
        if (channel.userId !== user.id) return res.status(403).json({ error: 'Not your channel' });

        await channel.destroy();
        res.json({ message: 'Channel deleted' });
    } catch (error) {
        console.error('Delete channel error:', error);
        res.status(500).json({ error: 'Failed to delete channel' });
    }
});

module.exports = router;

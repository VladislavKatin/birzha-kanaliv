const router = require('express').Router();
const { TrafficMatch, TrafficOffer, YouTubeAccount, User, Review } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');

/**
 * @route GET /api/exchanges
 * @description Get completed exchanges with partner info and hasReviewed flag
 * @access Private
 * @returns {Object} exchanges[] - { id, partner, offer, completedAt, hasReviewed, myChannelId }
 */
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findOne({ where: { firebaseUid: req.firebaseUser.uid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const channels = await YouTubeAccount.findAll({ where: { userId: user.id } });
        const channelIds = channels.map(c => c.id);

        if (channelIds.length === 0) return res.json({ exchanges: [] });

        const matches = await TrafficMatch.findAll({
            where: {
                [Op.or]: [
                    { initiatorChannelId: { [Op.in]: channelIds } },
                    { targetChannelId: { [Op.in]: channelIds } },
                ],
                status: 'completed',
            },
            include: [
                {
                    model: YouTubeAccount, as: 'initiatorChannel',
                    attributes: ['id', 'channelTitle', 'channelAvatar', 'subscribers'],
                    include: [{ model: User, as: 'owner', attributes: ['displayName', 'photoURL'] }],
                },
                {
                    model: YouTubeAccount, as: 'targetChannel',
                    attributes: ['id', 'channelTitle', 'channelAvatar', 'subscribers'],
                    include: [{ model: User, as: 'owner', attributes: ['displayName', 'photoURL'] }],
                },
                {
                    model: TrafficOffer, as: 'offer',
                    attributes: ['type', 'description'],
                },
                {
                    model: Review, as: 'reviews',
                    attributes: ['id', 'fromChannelId', 'toChannelId', 'rating', 'comment'],
                },
            ],
            order: [['completedAt', 'DESC']],
        });

        // Enrich with "hasReviewed" flag
        const exchanges = matches.map(m => {
            const isInitiator = channelIds.includes(m.initiatorChannelId);
            const myChannelId = isInitiator ? m.initiatorChannelId : m.targetChannelId;
            const hasReviewed = m.reviews?.some(r => r.fromChannelId === myChannelId);
            const partner = isInitiator ? m.targetChannel : m.initiatorChannel;

            return {
                id: m.id,
                partner,
                offer: m.offer,
                completedAt: m.completedAt,
                hasReviewed,
                myChannelId,
            };
        });

        res.json({ exchanges });
    } catch (error) {
        console.error('Get exchanges error:', error);
        res.status(500).json({ error: 'Failed to get exchanges' });
    }
});

module.exports = router;

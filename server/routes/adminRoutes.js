const router = require('express').Router();
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const {
    sequelize,
    User,
    YouTubeAccount,
    TrafficOffer,
    TrafficMatch,
    Review,
    Message,
    ChatRoom,
    ActionLog,
} = require('../models');

/**
 * @route GET /api/admin/overview
 * @description Aggregated admin analytics dashboard data.
 * @access Private (admin)
 */
router.get('/overview', auth, admin, async (req, res) => {
    try {
        const now = new Date();
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const payload = await sequelize.transaction(async (transaction) => {
            const [
                totalUsers,
                totalChannels,
                totalOffers,
                totalMatches,
                totalMessages,
                totalReviews,
                newUsers7d,
                matchesCompleted7d,
            ] = await Promise.all([
                User.count({ transaction }),
                YouTubeAccount.count({ transaction }),
                TrafficOffer.count({ transaction }),
                TrafficMatch.count({ transaction }),
                Message.count({ transaction }),
                Review.count({ transaction }),
                User.count({ where: { createdAt: { [Op.gte]: sevenDaysAgo } }, transaction }),
                TrafficMatch.count({ where: { status: 'completed', updatedAt: { [Op.gte]: sevenDaysAgo } }, transaction }),
            ]);

            const [offerStatusRows, matchStatusRows, topNicheRows] = await Promise.all([
                TrafficOffer.findAll({
                    attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
                    group: ['status'],
                    raw: true,
                    transaction,
                }),
                TrafficMatch.findAll({
                    attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
                    group: ['status'],
                    raw: true,
                    transaction,
                }),
                YouTubeAccount.findAll({
                    attributes: ['niche', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
                    where: {
                        niche: {
                            [Op.not]: null,
                        },
                    },
                    group: ['niche'],
                    order: [[sequelize.literal('count'), 'DESC']],
                    limit: 6,
                    raw: true,
                    transaction,
                }),
            ]);

            const [recentUsers, recentMatches, recentMessages] = await Promise.all([
                User.findAll({
                    attributes: ['id', 'displayName', 'email', 'role', 'createdAt'],
                    order: [['createdAt', 'DESC']],
                    limit: 10,
                    transaction,
                }),
                TrafficMatch.findAll({
                    attributes: ['id', 'status', 'createdAt', 'updatedAt'],
                    include: [
                        { model: YouTubeAccount, as: 'initiatorChannel', attributes: ['id', 'channelTitle'] },
                        { model: YouTubeAccount, as: 'targetChannel', attributes: ['id', 'channelTitle'] },
                        { model: TrafficOffer, as: 'offer', attributes: ['id', 'type', 'status'] },
                    ],
                    order: [['updatedAt', 'DESC']],
                    limit: 12,
                    transaction,
                }),
                Message.findAll({
                    attributes: ['id', 'content', 'createdAt'],
                    include: [
                        { model: User, as: 'sender', attributes: ['id', 'displayName', 'email'] },
                        {
                            model: ChatRoom,
                            as: 'chatRoom',
                            attributes: ['id', 'matchId'],
                        },
                    ],
                    order: [['createdAt', 'DESC']],
                    limit: 12,
                    transaction,
                }),
            ]);

            await ActionLog.create(
                {
                    userId: req.dbUser.id,
                    action: 'admin_overview_opened',
                    details: {
                        at: now.toISOString(),
                        totalUsers,
                        totalChannels,
                        totalOffers,
                        totalMatches,
                    },
                    ip: req.ip,
                },
                { transaction },
            );

            return {
                generatedAt: now.toISOString(),
                summary: {
                    totalUsers,
                    totalChannels,
                    totalOffers,
                    totalMatches,
                    totalMessages,
                    totalReviews,
                    newUsers7d,
                    matchesCompleted7d,
                },
                distributions: {
                    offersByStatus: offerStatusRows,
                    matchesByStatus: matchStatusRows,
                    topNiches: topNicheRows,
                },
                recent: {
                    users: recentUsers,
                    matches: recentMatches,
                    messages: recentMessages,
                },
            };
        });

        res.json(payload);
    } catch (error) {
        console.error('Admin overview error:', error);
        res.status(500).json({ error: 'Failed to load admin overview' });
    }
});

module.exports = router;

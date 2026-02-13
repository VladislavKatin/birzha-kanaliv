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

const ALLOWED_ROLES = new Set(['user', 'admin', 'suspended']);

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

/**
 * @route GET /api/admin/users
 * @description Search and paginate users for admin management.
 * @access Private (admin)
 */
router.get('/users', auth, admin, async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
        const offset = (page - 1) * limit;
        const search = String(req.query.search || '').trim();
        const role = String(req.query.role || '').trim();

        const where = {};
        if (role) {
            where.role = role;
        }
        if (search) {
            where[Op.or] = [
                { email: { [Op.iLike]: `%${search}%` } },
                { displayName: { [Op.iLike]: `%${search}%` } },
                { firebaseUid: { [Op.iLike]: `%${search}%` } },
            ];
        }

        const payload = await sequelize.transaction(async (transaction) => {
            const { rows, count } = await User.findAndCountAll({
                where,
                attributes: ['id', 'firebaseUid', 'email', 'displayName', 'role', 'createdAt', 'updatedAt'],
                order: [['createdAt', 'DESC']],
                limit,
                offset,
                transaction,
            });

            const userIds = rows.map((row) => row.id);
            const channelCountsRaw = userIds.length > 0
                ? await YouTubeAccount.findAll({
                    attributes: ['userId', [sequelize.fn('COUNT', sequelize.col('id')), 'channelCount']],
                    where: { userId: { [Op.in]: userIds } },
                    group: ['userId'],
                    raw: true,
                    transaction,
                })
                : [];

            const channelCounts = new Map(
                channelCountsRaw.map((row) => [row.userId, Number(row.channelCount || 0)]),
            );

            await ActionLog.create({
                userId: req.dbUser.id,
                action: 'admin_users_list_opened',
                details: { page, limit, role: role || null, search: search || null },
                ip: req.ip,
            }, { transaction });

            return {
                page,
                limit,
                total: count,
                pages: Math.max(Math.ceil(count / limit), 1),
                users: rows.map((row) => ({
                    ...row.toJSON(),
                    channelCount: channelCounts.get(row.id) || 0,
                })),
            };
        });

        res.json(payload);
    } catch (error) {
        console.error('Admin users list error:', error);
        res.status(500).json({ error: 'Failed to load admin users' });
    }
});

/**
 * @route PATCH /api/admin/users/:id/role
 * @description Change user role.
 * @access Private (admin)
 */
router.patch('/users/:id/role', auth, admin, async (req, res) => {
    try {
        const targetRole = String(req.body.role || '').trim();
        const reason = String(req.body.reason || '').trim();

        if (!ALLOWED_ROLES.has(targetRole)) {
            return res.status(400).json({ error: 'Invalid role value' });
        }

        const payload = await sequelize.transaction(async (transaction) => {
            const target = await User.findByPk(req.params.id, { transaction });
            if (!target) {
                return null;
            }

            const previousRole = target.role;
            if (previousRole !== targetRole) {
                target.role = targetRole;
                await target.save({ transaction });
            }

            await ActionLog.create({
                userId: req.dbUser.id,
                action: 'admin_user_role_changed',
                details: {
                    targetUserId: target.id,
                    previousRole,
                    targetRole,
                    reason: reason || null,
                },
                ip: req.ip,
            }, { transaction });

            return {
                id: target.id,
                email: target.email,
                displayName: target.displayName,
                role: target.role,
            };
        });

        if (!payload) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: payload });
    } catch (error) {
        console.error('Admin user role update error:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

/**
 * @route PATCH /api/admin/users/:id/suspend
 * @description Suspend or restore user access.
 * @access Private (admin)
 */
router.patch('/users/:id/suspend', auth, admin, async (req, res) => {
    try {
        const suspended = Boolean(req.body.suspended);
        const reason = String(req.body.reason || '').trim();

        const payload = await sequelize.transaction(async (transaction) => {
            const target = await User.findByPk(req.params.id, { transaction });
            if (!target) {
                return null;
            }

            if (target.id === req.dbUser.id) {
                return { selfBlock: true };
            }

            const previousRole = target.role;
            const nextRole = suspended ? 'suspended' : 'user';
            target.role = nextRole;
            await target.save({ transaction });

            await ActionLog.create({
                userId: req.dbUser.id,
                action: 'admin_user_suspension_changed',
                details: {
                    targetUserId: target.id,
                    suspended,
                    reason: reason || null,
                    previousRole,
                    nextRole,
                },
                ip: req.ip,
            }, { transaction });

            return {
                id: target.id,
                email: target.email,
                displayName: target.displayName,
                role: target.role,
            };
        });

        if (!payload) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (payload.selfBlock) {
            return res.status(400).json({ error: 'Cannot suspend yourself' });
        }

        res.json({ user: payload });
    } catch (error) {
        console.error('Admin user suspension update error:', error);
        res.status(500).json({ error: 'Failed to update user suspension status' });
    }
});

module.exports = router;

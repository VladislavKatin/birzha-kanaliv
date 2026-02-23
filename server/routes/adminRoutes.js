const router = require('express').Router();
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { normalizeIncomingMessagePayload } = require('../services/chatMessagePayload');
const { getSystemLimits, normalizeIncomingLimits, validateLimits } = require('../services/systemLimitsService');
const { emitSupportMessage } = require('../socketSetup');
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
const ALLOWED_OFFER_STATUSES = new Set(['open', 'matched', 'completed']);
const ALLOWED_MATCH_STATUSES = new Set(['pending', 'accepted', 'completed', 'rejected']);
const DEMO_CHANNEL_PREFIX = 'UC_DEMO_';

function parsePagination(req, defaultLimit = 20, maxLimit = 100) {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || defaultLimit, 1), maxLimit);
    const offset = (page - 1) * limit;
    return { page, limit, offset };
}

function csvEscape(value) {
    const raw = value == null ? '' : String(value);
    const escaped = raw.replaceAll('"', '""');
    return `"${escaped}"`;
}

function toCsv(headers, rows) {
    const headerLine = headers.map(csvEscape).join(',');
    const lines = rows.map((row) => row.map(csvEscape).join(','));
    return [headerLine, ...lines].join('\n');
}

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

/**
 * @route GET /api/admin/channels
 * @description List channels for moderation.
 * @access Private (admin)
 */
router.get('/channels', auth, admin, async (req, res) => {
    try {
        const { page, limit, offset } = parsePagination(req, 25, 100);
        const search = String(req.query.search || '').trim();
        const niche = String(req.query.niche || '').trim();
        const language = String(req.query.language || '').trim();
        const flagged = String(req.query.flagged || '').trim();

        const where = {};
        if (niche) where.niche = niche;
        if (language) where.language = language;
        if (flagged === 'true') where.isFlagged = true;
        if (flagged === 'false') where.isFlagged = false;
        if (search) {
            where[Op.or] = [
                { channelTitle: { [Op.iLike]: `%${search}%` } },
                { channelId: { [Op.iLike]: `%${search}%` } },
            ];
        }

        const payload = await sequelize.transaction(async (transaction) => {
            const { rows, count } = await YouTubeAccount.findAndCountAll({
                where,
                include: [{ model: User, as: 'owner', attributes: ['id', 'displayName', 'email', 'role'] }],
                order: [['createdAt', 'DESC']],
                limit,
                offset,
                transaction,
            });

            await ActionLog.create({
                userId: req.dbUser.id,
                action: 'admin_channels_list_opened',
                details: { page, limit, search: search || null, niche: niche || null, language: language || null, flagged: flagged || null },
                ip: req.ip,
            }, { transaction });

            return {
                page,
                limit,
                total: count,
                pages: Math.max(Math.ceil(count / limit), 1),
                channels: rows,
            };
        });

        res.json(payload);
    } catch (error) {
        console.error('Admin channels list error:', error);
        res.status(500).json({ error: 'Failed to load admin channels' });
    }
});

/**
 * @route PATCH /api/admin/channels/:id/flag
 * @description Toggle channel moderation flag.
 * @access Private (admin)
 */
router.patch('/channels/:id/flag', auth, admin, async (req, res) => {
    try {
        const isFlagged = Boolean(req.body.isFlagged);
        const reason = String(req.body.reason || '').trim();

        const payload = await sequelize.transaction(async (transaction) => {
            const channel = await YouTubeAccount.findByPk(req.params.id, { transaction });
            if (!channel) return null;

            const previous = { isFlagged: channel.isFlagged, flagReason: channel.flagReason || null };
            channel.isFlagged = isFlagged;
            channel.flagReason = isFlagged ? (reason || 'Flagged by admin') : null;
            await channel.save({ transaction });

            await ActionLog.create({
                userId: req.dbUser.id,
                action: 'admin_channel_flag_changed',
                details: {
                    channelId: channel.id,
                    previous,
                    next: { isFlagged: channel.isFlagged, flagReason: channel.flagReason || null },
                },
                ip: req.ip,
            }, { transaction });

            return channel;
        });

        if (!payload) return res.status(404).json({ error: 'Channel not found' });
        res.json({ channel: payload });
    } catch (error) {
        console.error('Admin channel flag update error:', error);
        res.status(500).json({ error: 'Failed to update channel flag' });
    }
});

/**
 * @route PATCH /api/admin/channels/:id/active
 * @description Toggle channel active status.
 * @access Private (admin)
 */
router.patch('/channels/:id/active', auth, admin, async (req, res) => {
    try {
        const isActive = Boolean(req.body.isActive);
        const reason = String(req.body.reason || '').trim();

        const payload = await sequelize.transaction(async (transaction) => {
            const channel = await YouTubeAccount.findByPk(req.params.id, { transaction });
            if (!channel) return null;

            const previousIsActive = channel.isActive;
            channel.isActive = isActive;
            await channel.save({ transaction });

            await ActionLog.create({
                userId: req.dbUser.id,
                action: 'admin_channel_active_changed',
                details: {
                    channelId: channel.id,
                    previousIsActive,
                    nextIsActive: channel.isActive,
                    reason: reason || null,
                },
                ip: req.ip,
            }, { transaction });

            return channel;
        });

        if (!payload) return res.status(404).json({ error: 'Channel not found' });
        res.json({ channel: payload });
    } catch (error) {
        console.error('Admin channel active update error:', error);
        res.status(500).json({ error: 'Failed to update channel status' });
    }
});

/**
 * @route GET /api/admin/offers
 * @description List offers for moderation.
 * @access Private (admin)
 */
router.get('/offers', auth, admin, async (req, res) => {
    try {
        const { page, limit, offset } = parsePagination(req, 25, 100);
        const status = String(req.query.status || '').trim();
        const type = String(req.query.type || '').trim();
        const search = String(req.query.search || '').trim();

        const where = {};
        if (status) where.status = status;
        if (type) where.type = type;
        if (search) where.description = { [Op.iLike]: `%${search}%` };

        const payload = await sequelize.transaction(async (transaction) => {
            const { rows, count } = await TrafficOffer.findAndCountAll({
                where,
                include: [
                    {
                        model: YouTubeAccount,
                        as: 'channel',
                        attributes: ['id', 'channelId', 'channelTitle', 'subscribers', 'niche', 'language', 'isFlagged', 'isActive'],
                        include: [{ model: User, as: 'owner', attributes: ['id', 'displayName', 'email', 'role'] }],
                    },
                ],
                order: [['createdAt', 'DESC']],
                limit,
                offset,
                transaction,
            });

            await ActionLog.create({
                userId: req.dbUser.id,
                action: 'admin_offers_list_opened',
                details: { page, limit, status: status || null, type: type || null, search: search || null },
                ip: req.ip,
            }, { transaction });

            return {
                page,
                limit,
                total: count,
                pages: Math.max(Math.ceil(count / limit), 1),
                offers: rows,
            };
        });

        res.json(payload);
    } catch (error) {
        console.error('Admin offers list error:', error);
        res.status(500).json({ error: 'Failed to load admin offers' });
    }
});

/**
 * @route PATCH /api/admin/offers/:id/status
 * @description Change offer status.
 * @access Private (admin)
 */
router.patch('/offers/:id/status', auth, admin, async (req, res) => {
    try {
        const status = String(req.body.status || '').trim();
        const reason = String(req.body.reason || '').trim();

        if (!ALLOWED_OFFER_STATUSES.has(status)) {
            return res.status(400).json({ error: 'Invalid offer status value' });
        }

        const payload = await sequelize.transaction(async (transaction) => {
            const offer = await TrafficOffer.findByPk(req.params.id, { transaction });
            if (!offer) return null;

            const previousStatus = offer.status;
            offer.status = status;
            await offer.save({ transaction });

            await ActionLog.create({
                userId: req.dbUser.id,
                action: 'admin_offer_status_changed',
                details: {
                    offerId: offer.id,
                    previousStatus,
                    nextStatus: offer.status,
                    reason: reason || null,
                },
                ip: req.ip,
            }, { transaction });

            return offer;
        });

        if (!payload) return res.status(404).json({ error: 'Offer not found' });
        res.json({ offer: payload });
    } catch (error) {
        console.error('Admin offer status update error:', error);
        res.status(500).json({ error: 'Failed to update offer status' });
    }
});

/**
 * @route GET /api/admin/matches
 * @description List matches for moderation.
 * @access Private (admin)
 */
router.get('/matches', auth, admin, async (req, res) => {
    try {
        const { page, limit, offset } = parsePagination(req, 25, 100);
        const status = String(req.query.status || '').trim();

        const where = {};
        if (status) where.status = status;

        const payload = await sequelize.transaction(async (transaction) => {
            const { rows, count } = await TrafficMatch.findAndCountAll({
                where,
                include: [
                    { model: TrafficOffer, as: 'offer', attributes: ['id', 'type', 'status', 'description'] },
                    { model: YouTubeAccount, as: 'initiatorChannel', attributes: ['id', 'channelTitle', 'subscribers'] },
                    { model: YouTubeAccount, as: 'targetChannel', attributes: ['id', 'channelTitle', 'subscribers'] },
                ],
                order: [['updatedAt', 'DESC']],
                limit,
                offset,
                transaction,
            });

            await ActionLog.create({
                userId: req.dbUser.id,
                action: 'admin_matches_list_opened',
                details: { page, limit, status: status || null },
                ip: req.ip,
            }, { transaction });

            return {
                page,
                limit,
                total: count,
                pages: Math.max(Math.ceil(count / limit), 1),
                matches: rows,
            };
        });

        res.json(payload);
    } catch (error) {
        console.error('Admin matches list error:', error);
        res.status(500).json({ error: 'Failed to load admin matches' });
    }
});

/**
 * @route PATCH /api/admin/matches/:id/status
 * @description Change match status.
 * @access Private (admin)
 */
router.patch('/matches/:id/status', auth, admin, async (req, res) => {
    try {
        const status = String(req.body.status || '').trim();
        const reason = String(req.body.reason || '').trim();

        if (!ALLOWED_MATCH_STATUSES.has(status)) {
            return res.status(400).json({ error: 'Invalid match status value' });
        }

        const payload = await sequelize.transaction(async (transaction) => {
            const match = await TrafficMatch.findByPk(req.params.id, { transaction });
            if (!match) return null;

            const previousStatus = match.status;
            match.status = status;
            if (status === 'completed' && !match.completedAt) {
                match.completedAt = new Date();
            }
            if (status !== 'completed') {
                match.completedAt = null;
            }
            await match.save({ transaction });

            await ActionLog.create({
                userId: req.dbUser.id,
                action: 'admin_match_status_changed',
                details: {
                    matchId: match.id,
                    previousStatus,
                    nextStatus: match.status,
                    reason: reason || null,
                },
                ip: req.ip,
            }, { transaction });

            return match;
        });

        if (!payload) return res.status(404).json({ error: 'Match not found' });
        res.json({ match: payload });
    } catch (error) {
        console.error('Admin match status update error:', error);
        res.status(500).json({ error: 'Failed to update match status' });
    }
});

/**
 * @route GET /api/admin/exchange-history
 * @description Exchange history with analytics.
 * @access Private (admin)
 */
router.get('/exchange-history', auth, admin, async (req, res) => {
    try {
        const { page, limit, offset } = parsePagination(req, 25, 100);
        const status = String(req.query.status || '').trim();
        const search = String(req.query.search || '').trim();

        const where = {};
        if (status) where.status = status;
        if (search) {
            where[Op.or] = [
                { '$initiatorChannel.channelTitle$': { [Op.iLike]: `%${search}%` } },
                { '$targetChannel.channelTitle$': { [Op.iLike]: `%${search}%` } },
                { '$offer.description$': { [Op.iLike]: `%${search}%` } },
            ];
        }

        const payload = await sequelize.transaction(async (transaction) => {
            const { rows, count } = await TrafficMatch.findAndCountAll({
                where,
                include: [
                    {
                        model: TrafficOffer,
                        as: 'offer',
                        attributes: ['id', 'type', 'status', 'description', 'niche', 'language'],
                    },
                    {
                        model: YouTubeAccount,
                        as: 'initiatorChannel',
                        attributes: ['id', 'channelTitle', 'subscribers'],
                    },
                    {
                        model: YouTubeAccount,
                        as: 'targetChannel',
                        attributes: ['id', 'channelTitle', 'subscribers'],
                    },
                    {
                        model: Review,
                        as: 'reviews',
                        attributes: ['id', 'rating', 'isPublished', 'createdAt'],
                        required: false,
                    },
                ],
                subQuery: false,
                distinct: true,
                order: [['updatedAt', 'DESC']],
                limit,
                offset,
                transaction,
            });

            const statusRows = await TrafficMatch.findAll({
                attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
                group: ['status'],
                raw: true,
                transaction,
            });

            const completedCount = Number(
                await TrafficMatch.count({ where: { status: 'completed' }, transaction }),
            );
            const reviewsCount = Number(await Review.count({ transaction }));
            const avgRatingRaw = await Review.findOne({
                attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']],
                raw: true,
                transaction,
            });
            const avgRating = Number(avgRatingRaw?.avgRating || 0);

            await ActionLog.create({
                userId: req.dbUser.id,
                action: 'admin_exchange_history_opened',
                details: { page, limit, status: status || null, search: search || null },
                ip: req.ip,
            }, { transaction });

            return {
                page,
                limit,
                total: count,
                pages: Math.max(Math.ceil(count / limit), 1),
                summary: {
                    completedCount,
                    reviewsCount,
                    avgRating: Number.isFinite(avgRating) ? Number(avgRating.toFixed(2)) : 0,
                    statuses: statusRows,
                },
                matches: rows.map((match) => {
                    const reviews = Array.isArray(match.reviews) ? match.reviews : [];
                    const rating = reviews.length
                        ? reviews.reduce((sum, row) => sum + Number(row.rating || 0), 0) / reviews.length
                        : 0;
                    return {
                        ...match.toJSON(),
                        reviewsCount: reviews.length,
                        avgRating: Number.isFinite(rating) ? Number(rating.toFixed(2)) : 0,
                    };
                }),
            };
        });

        res.json(payload);
    } catch (error) {
        console.error('Admin exchange history error:', error);
        res.status(500).json({ error: 'Failed to load exchange history' });
    }
});

/**
 * @route GET /api/admin/support/threads
 * @description List support threads by user.
 * @access Private (admin)
 */
router.get('/support/threads', auth, admin, async (req, res) => {
    try {
        const payload = await sequelize.transaction(async (transaction) => {
            const users = await User.findAll({
                where: { role: { [Op.ne]: 'admin' } },
                attributes: ['id', 'displayName', 'email', 'role', 'createdAt'],
                raw: true,
                transaction,
            });

            const adminUsers = await User.findAll({
                where: { role: 'admin' },
                attributes: ['id'],
                raw: true,
                transaction,
            });
            const adminIds = new Set(adminUsers.map((row) => row.id));

            const logs = await ActionLog.findAll({
                where: { action: 'support_chat_message' },
                include: [{ model: User, as: 'user', attributes: ['id', 'displayName', 'email', 'role'] }],
                order: [['createdAt', 'ASC']],
                limit: 2000,
                transaction,
            });

            const userById = new Map(users.map((row) => [row.id, row]));
            const threadsMap = new Map(
                users.map((row) => [row.id, {
                    user: row,
                    lastMessageAt: null,
                    lastMessage: '',
                    totalMessages: 0,
                }]),
            );

            logs.forEach((log) => {
                const details = log.details || {};
                const senderId = log.userId;
                const senderRole = log.user?.role || 'user';
                const text = String(details.text || '').trim();
                const hasImage = !!details.imageData;

                if (adminIds.has(senderId) || senderRole === 'admin') {
                    const targetUserId = details.targetUserId || null;
                    if (!targetUserId || !threadsMap.has(targetUserId)) {
                        return;
                    }
                    const thread = threadsMap.get(targetUserId);
                    thread.totalMessages += 1;
                    thread.lastMessageAt = log.createdAt;
                    thread.lastMessage = text || (hasImage ? '[image]' : '');
                    return;
                }

                if (!userById.has(senderId)) {
                    return;
                }
                const thread = threadsMap.get(senderId);
                thread.totalMessages += 1;
                thread.lastMessageAt = log.createdAt;
                thread.lastMessage = text || (hasImage ? '[image]' : '');
            });

            const threads = Array.from(threadsMap.values())
                .filter((thread) => thread.totalMessages > 0)
                .sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));

            await ActionLog.create({
                userId: req.dbUser.id,
                action: 'admin_support_threads_opened',
                details: { threadCount: threads.length },
                ip: req.ip,
            }, { transaction });

            return { threads };
        });

        res.json(payload);
    } catch (error) {
        console.error('Admin support threads error:', error);
        res.status(500).json({ error: 'Failed to load support threads' });
    }
});

/**
 * @route GET /api/admin/menu-badges
 * @description Aggregated menu badges for admin sidebar (new user registrations and similar counters).
 * @access Private (admin)
 */
router.get('/menu-badges', auth, admin, async (req, res) => {
    try {
        const payload = await sequelize.transaction(async (transaction) => {
            const lastSeenLog = await ActionLog.findOne({
                where: {
                    userId: req.dbUser.id,
                    action: 'admin_menu_badges_seen',
                },
                order: [['createdAt', 'DESC']],
                transaction,
            });

            const usersSeenAt = lastSeenLog?.details?.scope === 'users'
                ? lastSeenLog.createdAt
                : null;

            const usersWhere = {
                role: { [Op.ne]: 'admin' },
            };
            if (usersSeenAt) {
                usersWhere.createdAt = { [Op.gt]: usersSeenAt };
            }

            const [newUsers] = await Promise.all([
                User.count({ where: usersWhere, transaction }),
            ]);

            await ActionLog.create({
                userId: req.dbUser.id,
                action: 'admin_menu_badges_opened',
                details: {
                    usersSeenAt: usersSeenAt ? usersSeenAt.toISOString() : null,
                    newUsers,
                },
                ip: req.ip,
            }, { transaction });

            return {
                newUsers,
                usersSeenAt: usersSeenAt ? usersSeenAt.toISOString() : null,
            };
        });

        res.json(payload);
    } catch (error) {
        console.error('Admin menu badges error:', error);
        res.status(500).json({ error: 'Failed to load admin menu badges' });
    }
});

/**
 * @route POST /api/admin/menu-badges/seen
 * @description Mark a specific admin badge scope as seen.
 * @access Private (admin)
 */
router.post('/menu-badges/seen', auth, admin, async (req, res) => {
    try {
        const scope = String(req.body?.scope || '').trim() || 'users';
        const allowedScopes = new Set(['users']);
        if (!allowedScopes.has(scope)) {
            return res.status(400).json({ error: 'Invalid badge scope' });
        }

        await sequelize.transaction(async (transaction) => {
            await ActionLog.create({
                userId: req.dbUser.id,
                action: 'admin_menu_badges_seen',
                details: { scope },
                ip: req.ip,
            }, { transaction });
        });

        res.json({ ok: true, scope });
    } catch (error) {
        console.error('Admin menu badge seen error:', error);
        res.status(500).json({ error: 'Failed to mark admin menu badge as seen' });
    }
});

/**
 * @route GET /api/admin/support/threads/:userId/messages
 * @description Get support thread messages for a concrete user.
 * @access Private (admin)
 */
router.get('/support/threads/:userId/messages', auth, admin, async (req, res) => {
    try {
        const payload = await sequelize.transaction(async (transaction) => {
            const user = await User.findByPk(req.params.userId, {
                attributes: ['id', 'displayName', 'email', 'role'],
                transaction,
            });
            if (!user || user.role === 'admin') {
                return null;
            }

            const adminUsers = await User.findAll({
                where: { role: 'admin' },
                attributes: ['id'],
                raw: true,
                transaction,
            });
            const adminIds = new Set(adminUsers.map((row) => row.id));

            const logs = await ActionLog.findAll({
                where: { action: 'support_chat_message' },
                include: [{ model: User, as: 'user', attributes: ['id', 'displayName', 'email', 'role'] }],
                order: [['createdAt', 'ASC']],
                limit: 2000,
                transaction,
            });

            const messages = logs
                .filter((log) => {
                    const details = log.details || {};
                    if (log.userId === user.id) {
                        return true;
                    }
                    if (!adminIds.has(log.userId)) {
                        return false;
                    }
                    return details.targetUserId === user.id;
                })
                .map((log) => ({
                    id: log.id,
                    createdAt: log.createdAt,
                    content: log.details?.text || '',
                    imageData: log.details?.imageData || null,
                    sender: {
                        id: log.user?.id || null,
                        displayName: log.user?.displayName || log.user?.email || 'User',
                        role: log.user?.role || 'user',
                    },
                    isAdmin: log.user?.role === 'admin',
                }));

            await ActionLog.create({
                userId: req.dbUser.id,
                action: 'admin_support_thread_opened',
                details: { targetUserId: user.id, messageCount: messages.length },
                ip: req.ip,
            }, { transaction });

            return {
                user,
                messages,
            };
        });

        if (!payload) {
            return res.status(404).json({ error: 'Support user not found' });
        }

        res.json(payload);
    } catch (error) {
        console.error('Admin support thread load error:', error);
        res.status(500).json({ error: 'Failed to load support thread' });
    }
});

/**
 * @route POST /api/admin/support/threads/:userId/messages
 * @description Send support reply as admin.
 * @access Private (admin)
 */
router.post('/support/threads/:userId/messages', auth, admin, async (req, res) => {
    try {
        let incoming;
        try {
            incoming = normalizeIncomingMessagePayload(req.body || {});
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }

        const payload = await sequelize.transaction(async (transaction) => {
            const user = await User.findByPk(req.params.userId, {
                attributes: ['id', 'displayName', 'email', 'role'],
                transaction,
            });
            if (!user || user.role === 'admin') {
                return null;
            }

            const messageLog = await ActionLog.create({
                userId: req.dbUser.id,
                action: 'support_chat_message',
                details: {
                    text: incoming.text || '',
                    imageData: incoming.imageData || null,
                    targetUserId: user.id,
                },
                ip: req.ip,
            }, { transaction });

            await ActionLog.create({
                userId: req.dbUser.id,
                action: 'admin_support_reply_sent',
                details: {
                    targetUserId: user.id,
                    supportMessageId: messageLog.id,
                    hasImage: !!incoming.imageData,
                },
                ip: req.ip,
            }, { transaction });

            return {
                user,
                message: {
                    id: messageLog.id,
                    createdAt: messageLog.createdAt,
                    content: incoming.text || '',
                    imageData: incoming.imageData || null,
                    sender: {
                        id: req.dbUser.id,
                        displayName: req.dbUser.displayName || req.dbUser.email,
                        role: req.dbUser.role,
                    },
                    isAdmin: true,
                },
            };
        });

        if (!payload) {
            return res.status(404).json({ error: 'Support user not found' });
        }

        res.status(201).json(payload);

        const io = req.app.get('io');
        emitSupportMessage(io, [payload.user.id, req.dbUser.id], payload.message);
    } catch (error) {
        console.error('Admin support reply error:', error);
        res.status(500).json({ error: 'Failed to send support reply' });
    }
});

/**
 * @route GET /api/admin/users/:id/details
 * @description Detailed user profile for admin review.
 * @access Private (admin)
 */
router.get('/users/:id/details', auth, admin, async (req, res) => {
    try {
        const payload = await sequelize.transaction(async (transaction) => {
            const target = await User.findByPk(req.params.id, {
                attributes: ['id', 'firebaseUid', 'email', 'displayName', 'photoURL', 'role', 'createdAt', 'updatedAt'],
                transaction,
            });
            if (!target) {
                return null;
            }

            const channels = await YouTubeAccount.findAll({
                where: { userId: target.id },
                attributes: [
                    'id',
                    'channelId',
                    'channelTitle',
                    'subscribers',
                    'avgViews30d',
                    'niche',
                    'language',
                    'isActive',
                    'isFlagged',
                    'flagReason',
                    'lastAnalyticsUpdate',
                    'createdAt',
                ],
                order: [['createdAt', 'DESC']],
                transaction,
            });

            const channelIds = channels.map((channel) => channel.id);
            const offers = channelIds.length
                ? await TrafficOffer.findAll({
                    where: { channelId: { [Op.in]: channelIds } },
                    attributes: ['id', 'channelId', 'type', 'status', 'description', 'createdAt'],
                    order: [['createdAt', 'DESC']],
                    limit: 30,
                    transaction,
                })
                : [];

            const matches = channelIds.length
                ? await TrafficMatch.findAll({
                    where: {
                        [Op.or]: [
                            { initiatorChannelId: { [Op.in]: channelIds } },
                            { targetChannelId: { [Op.in]: channelIds } },
                        ],
                    },
                    attributes: [
                        'id',
                        'offerId',
                        'initiatorChannelId',
                        'targetChannelId',
                        'status',
                        'initiatorConfirmed',
                        'targetConfirmed',
                        'completedAt',
                        'createdAt',
                        'updatedAt',
                    ],
                    include: [
                        { model: YouTubeAccount, as: 'initiatorChannel', attributes: ['id', 'channelTitle'] },
                        { model: YouTubeAccount, as: 'targetChannel', attributes: ['id', 'channelTitle'] },
                    ],
                    order: [['updatedAt', 'DESC']],
                    limit: 40,
                    transaction,
                })
                : [];

            const matchIds = matches.map((match) => match.id);
            const reviews = matchIds.length
                ? await Review.findAll({
                    where: { matchId: { [Op.in]: matchIds } },
                    attributes: ['id', 'matchId', 'rating', 'comment', 'isPublished', 'createdAt'],
                    order: [['createdAt', 'DESC']],
                    limit: 40,
                    transaction,
                })
                : [];

            const supportMessages = await ActionLog.count({
                where: {
                    action: 'support_chat_message',
                    userId: target.id,
                },
                transaction,
            });

            const recentActions = await ActionLog.findAll({
                where: { userId: target.id },
                attributes: ['id', 'action', 'details', 'ip', 'createdAt'],
                order: [['createdAt', 'DESC']],
                limit: 50,
                transaction,
            });

            await ActionLog.create({
                userId: req.dbUser.id,
                action: 'admin_user_details_opened',
                details: { targetUserId: target.id },
                ip: req.ip,
            }, { transaction });

            return {
                user: target,
                summary: {
                    channels: channels.length,
                    offers: offers.length,
                    matches: matches.length,
                    reviews: reviews.length,
                    supportMessages,
                },
                channels,
                offers,
                matches,
                reviews,
                recentActions,
            };
        });

        if (!payload) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(payload);
    } catch (error) {
        console.error('Admin user details error:', error);
        res.status(500).json({ error: 'Failed to load user details' });
    }
});

/**
 * @route GET /api/admin/system/insights
 * @description Platform-level operational insights for admins.
 * @access Private (admin)
 */
router.get('/system/insights', auth, admin, async (req, res) => {
    try {
        const now = new Date();
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const payload = await sequelize.transaction(async (transaction) => {
            const [
                usersTotal,
                suspendedUsers,
                channelsTotal,
                flaggedChannels,
                inactiveChannels30d,
                offersOpen,
                matchesPending,
                supportMessages24h,
                adminActions24h,
            ] = await Promise.all([
                User.count({ transaction }),
                User.count({ where: { role: 'suspended' }, transaction }),
                YouTubeAccount.count({ transaction }),
                YouTubeAccount.count({ where: { isFlagged: true }, transaction }),
                YouTubeAccount.count({
                    where: {
                        [Op.or]: [
                            { lastAnalyticsUpdate: { [Op.lt]: monthAgo } },
                            {
                                lastAnalyticsUpdate: null,
                                createdAt: { [Op.lt]: monthAgo },
                            },
                        ],
                    },
                    transaction,
                }),
                TrafficOffer.count({ where: { status: 'open' }, transaction }),
                TrafficMatch.count({ where: { status: 'pending' }, transaction }),
                ActionLog.count({
                    where: {
                        action: 'support_chat_message',
                        createdAt: { [Op.gte]: dayAgo },
                    },
                    transaction,
                }),
                ActionLog.count({
                    where: {
                        action: { [Op.iLike]: 'admin_%' },
                        createdAt: { [Op.gte]: dayAgo },
                    },
                    transaction,
                }),
            ]);

            const [topActions, topIps, registrations, exchanges] = await Promise.all([
                ActionLog.findAll({
                    attributes: ['action', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
                    where: { createdAt: { [Op.gte]: dayAgo } },
                    group: ['action'],
                    order: [[sequelize.literal('count'), 'DESC']],
                    limit: 10,
                    raw: true,
                    transaction,
                }),
                ActionLog.findAll({
                    attributes: ['ip', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
                    where: {
                        createdAt: { [Op.gte]: dayAgo },
                        ip: { [Op.not]: null },
                    },
                    group: ['ip'],
                    order: [[sequelize.literal('count'), 'DESC']],
                    limit: 10,
                    raw: true,
                    transaction,
                }),
                User.findAll({
                    attributes: [
                        [sequelize.fn('DATE_TRUNC', 'day', sequelize.col('createdAt')), 'day'],
                        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                    ],
                    where: { createdAt: { [Op.gte]: weekAgo } },
                    group: [sequelize.fn('DATE_TRUNC', 'day', sequelize.col('createdAt'))],
                    order: [[sequelize.fn('DATE_TRUNC', 'day', sequelize.col('createdAt')), 'ASC']],
                    raw: true,
                    transaction,
                }),
                TrafficMatch.findAll({
                    attributes: [
                        [sequelize.fn('DATE_TRUNC', 'day', sequelize.col('updatedAt')), 'day'],
                        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                    ],
                    where: {
                        status: 'completed',
                        updatedAt: { [Op.gte]: weekAgo },
                    },
                    group: [sequelize.fn('DATE_TRUNC', 'day', sequelize.col('updatedAt'))],
                    order: [[sequelize.fn('DATE_TRUNC', 'day', sequelize.col('updatedAt')), 'ASC']],
                    raw: true,
                    transaction,
                }),
            ]);

            const limitsConfig = await getSystemLimits({ ActionLog, transaction });

            await ActionLog.create({
                userId: req.dbUser.id,
                action: 'admin_system_insights_opened',
                details: { at: now.toISOString() },
                ip: req.ip,
            }, { transaction });

            return {
                generatedAt: now.toISOString(),
                summary: {
                    usersTotal,
                    suspendedUsers,
                    channelsTotal,
                    flaggedChannels,
                    inactiveChannels30d,
                    offersOpen,
                    matchesPending,
                    supportMessages24h,
                    adminActions24h,
                },
                topActions,
                topIps,
                registrations7d: registrations,
                completedExchanges7d: exchanges,
                currentLimits: limitsConfig.limits,
            };
        });

        res.json(payload);
    } catch (error) {
        console.error('Admin system insights error:', error);
        res.status(500).json({ error: 'Failed to load system insights' });
    }
});

/**
 * @route GET /api/admin/system/limits
 * @description Read configurable anti-spam limits.
 * @access Private (admin)
 */
router.get('/system/limits', auth, admin, async (req, res) => {
    try {
        const payload = await sequelize.transaction(async (transaction) => {
            const limits = await getSystemLimits({ ActionLog, transaction });

            await ActionLog.create({
                userId: req.dbUser.id,
                action: 'admin_system_limits_opened',
                details: { source: limits.source },
                ip: req.ip,
            }, { transaction });

            return limits;
        });

        res.json(payload);
    } catch (error) {
        console.error('Admin system limits read error:', error);
        res.status(500).json({ error: 'Failed to load system limits' });
    }
});

/**
 * @route PATCH /api/admin/system/limits
 * @description Update configurable anti-spam limits.
 * @access Private (admin)
 */
router.patch('/system/limits', auth, admin, async (req, res) => {
    try {
        const reason = String(req.body.reason || '').trim();
        const nextLimits = normalizeIncomingLimits(req.body || {});
        const validation = validateLimits(nextLimits);
        if (validation.length > 0) {
            return res.status(400).json({ error: validation.join('; ') });
        }

        const payload = await sequelize.transaction(async (transaction) => {
            const current = await getSystemLimits({ ActionLog, transaction });

            await ActionLog.create({
                userId: req.dbUser.id,
                action: 'admin_system_limits_updated',
                details: {
                    previous: current.limits,
                    limits: nextLimits,
                    reason: reason || null,
                },
                ip: req.ip,
            }, { transaction });

            return {
                limits: nextLimits,
                updatedAt: new Date().toISOString(),
            };
        });

        res.json(payload);
    } catch (error) {
        console.error('Admin system limits update error:', error);
        res.status(500).json({ error: 'Failed to update system limits' });
    }
});

/**
 * @route GET /api/admin/incidents
 * @description Security/operations incident feed.
 * @access Private (admin)
 */
router.get('/incidents', auth, admin, async (req, res) => {
    try {
        const range = String(req.query.range || '24h').trim();
        const severity = String(req.query.severity || '').trim();
        const from = range === '7d'
            ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            : new Date(Date.now() - 24 * 60 * 60 * 1000);

        const payload = await sequelize.transaction(async (transaction) => {
            const actionFilter = {
                [Op.or]: [
                    { [Op.iLike]: '%failed%' },
                    { [Op.iLike]: '%error%' },
                    { [Op.iLike]: '%suspend%' },
                    { [Op.iLike]: '%flag%' },
                    { [Op.iLike]: '%rate_limit%' },
                ],
            };

            const where = {
                createdAt: { [Op.gte]: from },
                action: actionFilter,
            };

            const logs = await ActionLog.findAll({
                where,
                include: [{ model: User, as: 'user', attributes: ['id', 'displayName', 'email', 'role'] }],
                order: [['createdAt', 'DESC']],
                limit: 200,
                transaction,
            });

            const ipCounter = new Map();
            logs.forEach((log) => {
                if (!log.ip) return;
                ipCounter.set(log.ip, (ipCounter.get(log.ip) || 0) + 1);
            });

            const incidents = logs.map((log) => {
                const action = String(log.action || '');
                let level = 'low';
                if (action.includes('failed') || action.includes('error')) level = 'high';
                if (action.includes('suspend') || action.includes('flag')) level = 'medium';
                const ipHits = log.ip ? (ipCounter.get(log.ip) || 0) : 0;
                let riskTag = 'normal';
                if (ipHits >= 25 || level === 'high') riskTag = 'critical';
                else if (ipHits >= 12 || level === 'medium') riskTag = 'elevated';
                return {
                    id: log.id,
                    createdAt: log.createdAt,
                    level,
                    riskTag,
                    action: log.action,
                    ip: log.ip,
                    details: log.details || {},
                    user: log.user || null,
                };
            }).filter((incident) => !severity || incident.level === severity);

            const topIps = await ActionLog.findAll({
                attributes: ['ip', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
                where: {
                    createdAt: { [Op.gte]: from },
                    ip: { [Op.not]: null },
                },
                group: ['ip'],
                order: [[sequelize.literal('count'), 'DESC']],
                limit: 10,
                raw: true,
                transaction,
            });

            const summaryByLevel = incidents.reduce((acc, row) => {
                acc[row.level] = (acc[row.level] || 0) + 1;
                return acc;
            }, {});

            const summaryByAction = incidents.reduce((acc, row) => {
                acc[row.action] = (acc[row.action] || 0) + 1;
                return acc;
            }, {});

            const topActions = Object.entries(summaryByAction)
                .map(([action, count]) => ({ action, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 12);

            await ActionLog.create({
                userId: req.dbUser.id,
                action: 'admin_incidents_opened',
                details: { range, severity: severity || null, count: incidents.length },
                ip: req.ip,
            }, { transaction });

            return {
                range,
                from: from.toISOString(),
                total: incidents.length,
                incidents,
                topIps,
                summaryByLevel,
                topActions,
            };
        });

        res.json(payload);
    } catch (error) {
        console.error('Admin incidents error:', error);
        res.status(500).json({ error: 'Failed to load incidents' });
    }
});

/**
 * @route GET /api/admin/demo/channels
 * @description Demo channels and offers overview.
 * @access Private (admin)
 */
router.get('/demo/channels', auth, admin, async (req, res) => {
    try {
        const payload = await sequelize.transaction(async (transaction) => {
            const channels = await YouTubeAccount.findAll({
                where: {
                    channelId: {
                        [Op.iLike]: `${DEMO_CHANNEL_PREFIX}%`,
                    },
                },
                include: [{ model: User, as: 'owner', attributes: ['id', 'displayName', 'email'] }],
                order: [['createdAt', 'DESC']],
                transaction,
            });

            const channelIds = channels.map((channel) => channel.id);
            const offers = channelIds.length
                ? await TrafficOffer.findAll({
                    where: { channelId: { [Op.in]: channelIds } },
                    include: [{ model: YouTubeAccount, as: 'channel', attributes: ['id', 'channelTitle', 'channelId', 'isActive'] }],
                    order: [['createdAt', 'DESC']],
                    transaction,
                })
                : [];

            await ActionLog.create({
                userId: req.dbUser.id,
                action: 'admin_demo_channels_opened',
                details: { channels: channels.length, offers: offers.length },
                ip: req.ip,
            }, { transaction });

            return {
                summary: {
                    channels: channels.length,
                    activeChannels: channels.filter((channel) => channel.isActive).length,
                    offers: offers.length,
                },
                channels,
                offers,
            };
        });

        res.json(payload);
    } catch (error) {
        console.error('Admin demo channels error:', error);
        res.status(500).json({ error: 'Failed to load demo channels' });
    }
});

/**
 * @route PATCH /api/admin/demo/channels/:id/active
 * @description Toggle demo channel active status.
 * @access Private (admin)
 */
router.patch('/demo/channels/:id/active', auth, admin, async (req, res) => {
    try {
        const isActive = Boolean(req.body.isActive);
        const reason = String(req.body.reason || '').trim();

        const payload = await sequelize.transaction(async (transaction) => {
            const channel = await YouTubeAccount.findByPk(req.params.id, { transaction });
            if (!channel) return null;
            if (!String(channel.channelId || '').toUpperCase().startsWith(DEMO_CHANNEL_PREFIX)) {
                return { invalid: true };
            }

            const previousIsActive = channel.isActive;
            channel.isActive = isActive;
            await channel.save({ transaction });

            await ActionLog.create({
                userId: req.dbUser.id,
                action: 'admin_demo_channel_active_changed',
                details: {
                    channelId: channel.id,
                    previousIsActive,
                    nextIsActive: channel.isActive,
                    reason: reason || null,
                },
                ip: req.ip,
            }, { transaction });

            return channel;
        });

        if (!payload) return res.status(404).json({ error: 'Channel not found' });
        if (payload.invalid) return res.status(400).json({ error: 'Channel is not marked as demo' });

        res.json({ channel: payload });
    } catch (error) {
        console.error('Admin demo channel active update error:', error);
        res.status(500).json({ error: 'Failed to update demo channel status' });
    }
});

/**
 * @route PATCH /api/admin/demo/offers/:id/status
 * @description Update demo offer status.
 * @access Private (admin)
 */
router.patch('/demo/offers/:id/status', auth, admin, async (req, res) => {
    try {
        const status = String(req.body.status || '').trim();
        const reason = String(req.body.reason || '').trim();

        if (!ALLOWED_OFFER_STATUSES.has(status)) {
            return res.status(400).json({ error: 'Invalid offer status value' });
        }

        const payload = await sequelize.transaction(async (transaction) => {
            const offer = await TrafficOffer.findByPk(req.params.id, {
                include: [{ model: YouTubeAccount, as: 'channel', attributes: ['id', 'channelId'] }],
                transaction,
            });
            if (!offer) return null;

            const channelId = String(offer.channel?.channelId || '').toUpperCase();
            if (!channelId.startsWith(DEMO_CHANNEL_PREFIX)) {
                return { invalid: true };
            }

            const previousStatus = offer.status;
            offer.status = status;
            await offer.save({ transaction });

            await ActionLog.create({
                userId: req.dbUser.id,
                action: 'admin_demo_offer_status_changed',
                details: {
                    offerId: offer.id,
                    previousStatus,
                    nextStatus: offer.status,
                    reason: reason || null,
                },
                ip: req.ip,
            }, { transaction });

            return offer;
        });

        if (!payload) return res.status(404).json({ error: 'Offer not found' });
        if (payload.invalid) return res.status(400).json({ error: 'Offer does not belong to demo channel' });

        res.json({ offer: payload });
    } catch (error) {
        console.error('Admin demo offer status update error:', error);
        res.status(500).json({ error: 'Failed to update demo offer status' });
    }
});

/**
 * @route GET /api/admin/exports/history
 * @description Export download history for admins.
 * @access Private (admin)
 */
router.get('/exports/history', auth, admin, async (req, res) => {
    try {
        const payload = await sequelize.transaction(async (transaction) => {
            const logs = await ActionLog.findAll({
                where: {
                    action: {
                        [Op.in]: [
                            'admin_export_users_csv',
                            'admin_export_exchanges_csv',
                            'admin_export_support_csv',
                        ],
                    },
                },
                include: [{ model: User, as: 'user', attributes: ['id', 'displayName', 'email'] }],
                order: [['createdAt', 'DESC']],
                limit: 300,
                transaction,
            });

            await ActionLog.create({
                userId: req.dbUser.id,
                action: 'admin_export_history_opened',
                details: { count: logs.length },
                ip: req.ip,
            }, { transaction });

            return {
                total: logs.length,
                items: logs.map((log) => ({
                    id: log.id,
                    action: log.action,
                    createdAt: log.createdAt,
                    ip: log.ip,
                    rowCount: Number(log.details?.rowCount || 0),
                    user: log.user ? {
                        id: log.user.id,
                        displayName: log.user.displayName,
                        email: log.user.email,
                    } : null,
                })),
            };
        });

        res.json(payload);
    } catch (error) {
        console.error('Admin export history error:', error);
        res.status(500).json({ error: 'Failed to load export history' });
    }
});

/**
 * @route GET /api/admin/exports/users.csv
 * @description Export users report in CSV format.
 * @access Private (admin)
 */
router.get('/exports/users.csv', auth, admin, async (req, res) => {
    try {
        const csv = await sequelize.transaction(async (transaction) => {
            const users = await User.findAll({
                attributes: ['id', 'email', 'displayName', 'role', 'createdAt'],
                order: [['createdAt', 'DESC']],
                transaction,
            });

            const userIds = users.map((user) => user.id);
            const channels = userIds.length
                ? await YouTubeAccount.findAll({
                    attributes: ['userId', [sequelize.fn('COUNT', sequelize.col('id')), 'channelCount']],
                    where: { userId: { [Op.in]: userIds } },
                    group: ['userId'],
                    raw: true,
                    transaction,
                })
                : [];
            const channelsMap = new Map(channels.map((row) => [row.userId, Number(row.channelCount || 0)]));

            await ActionLog.create({
                userId: req.dbUser.id,
                action: 'admin_export_users_csv',
                details: { rowCount: users.length },
                ip: req.ip,
            }, { transaction });

            return toCsv(
                ['id', 'email', 'displayName', 'role', 'channelCount', 'createdAt'],
                users.map((user) => [
                    user.id,
                    user.email,
                    user.displayName || '',
                    user.role,
                    channelsMap.get(user.id) || 0,
                    user.createdAt?.toISOString?.() || '',
                ]),
            );
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="users-${Date.now()}.csv"`);
        res.send(csv);
    } catch (error) {
        console.error('Admin users csv export error:', error);
        res.status(500).json({ error: 'Failed to export users csv' });
    }
});

/**
 * @route GET /api/admin/exports/exchanges.csv
 * @description Export exchanges report in CSV format.
 * @access Private (admin)
 */
router.get('/exports/exchanges.csv', auth, admin, async (req, res) => {
    try {
        const csv = await sequelize.transaction(async (transaction) => {
            const matches = await TrafficMatch.findAll({
                include: [
                    { model: TrafficOffer, as: 'offer', attributes: ['id', 'type', 'status'] },
                    { model: YouTubeAccount, as: 'initiatorChannel', attributes: ['channelTitle', 'channelId'] },
                    { model: YouTubeAccount, as: 'targetChannel', attributes: ['channelTitle', 'channelId'] },
                ],
                order: [['updatedAt', 'DESC']],
                transaction,
            });

            await ActionLog.create({
                userId: req.dbUser.id,
                action: 'admin_export_exchanges_csv',
                details: { rowCount: matches.length },
                ip: req.ip,
            }, { transaction });

            return toCsv(
                ['id', 'status', 'offerType', 'offerStatus', 'initiator', 'target', 'updatedAt'],
                matches.map((match) => [
                    match.id,
                    match.status,
                    match.offer?.type || '',
                    match.offer?.status || '',
                    match.initiatorChannel?.channelTitle || '',
                    match.targetChannel?.channelTitle || '',
                    match.updatedAt?.toISOString?.() || '',
                ]),
            );
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="exchanges-${Date.now()}.csv"`);
        res.send(csv);
    } catch (error) {
        console.error('Admin exchanges csv export error:', error);
        res.status(500).json({ error: 'Failed to export exchanges csv' });
    }
});

/**
 * @route GET /api/admin/exports/support.csv
 * @description Export support chat report in CSV format.
 * @access Private (admin)
 */
router.get('/exports/support.csv', auth, admin, async (req, res) => {
    try {
        const csv = await sequelize.transaction(async (transaction) => {
            const logs = await ActionLog.findAll({
                where: { action: 'support_chat_message' },
                include: [{ model: User, as: 'user', attributes: ['id', 'displayName', 'email', 'role'] }],
                order: [['createdAt', 'DESC']],
                limit: 5000,
                transaction,
            });

            await ActionLog.create({
                userId: req.dbUser.id,
                action: 'admin_export_support_csv',
                details: { rowCount: logs.length },
                ip: req.ip,
            }, { transaction });

            return toCsv(
                ['id', 'createdAt', 'senderEmail', 'senderRole', 'targetUserId', 'hasImage', 'content'],
                logs.map((log) => [
                    log.id,
                    log.createdAt?.toISOString?.() || '',
                    log.user?.email || '',
                    log.user?.role || '',
                    log.details?.targetUserId || '',
                    !!log.details?.imageData,
                    log.details?.text || '',
                ]),
            );
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="support-${Date.now()}.csv"`);
        res.send(csv);
    } catch (error) {
        console.error('Admin support csv export error:', error);
        res.status(500).json({ error: 'Failed to export support csv' });
    }
});

module.exports = router;

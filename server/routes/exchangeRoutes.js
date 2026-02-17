const router = require('express').Router();
const { sequelize, TrafficMatch, TrafficOffer, YouTubeAccount, User, Review, ActionLog } = require('../models');
const { Op, fn, col } = require('sequelize');
const auth = require('../middleware/auth');
const { normalizeOptionalString } = require('../utils/validators');

function parsePositiveInt(value, fallback, min = 1, max = 100) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return fallback;
    if (parsed < min) return min;
    if (parsed > max) return max;
    return parsed;
}

function parseReviewedFilter(value) {
    const allowed = new Set(['all', 'reviewed', 'unreviewed']);
    const normalized = String(value || 'all').toLowerCase();
    return allowed.has(normalized) ? normalized : 'all';
}

function parseExchangeSort(value) {
    const allowed = new Set(['newest', 'oldest', 'largest', 'unreviewed_first']);
    const normalized = String(value || 'newest').toLowerCase();
    return allowed.has(normalized) ? normalized : 'newest';
}

async function buildPartnerStatsMap(channelIds) {
    const ids = Array.from(new Set(channelIds.filter(Boolean)));
    const stats = new Map();
    if (!ids.length) return stats;

    const [initiatedAll, targetAll, initiatedCompleted, targetCompleted, reviewAgg] = await Promise.all([
        TrafficMatch.findAll({
            attributes: ['initiatorChannelId', [fn('COUNT', col('id')), 'count']],
            where: { initiatorChannelId: { [Op.in]: ids } },
            group: ['initiatorChannelId'],
            raw: true,
        }),
        TrafficMatch.findAll({
            attributes: ['targetChannelId', [fn('COUNT', col('id')), 'count']],
            where: { targetChannelId: { [Op.in]: ids } },
            group: ['targetChannelId'],
            raw: true,
        }),
        TrafficMatch.findAll({
            attributes: ['initiatorChannelId', [fn('COUNT', col('id')), 'count']],
            where: { initiatorChannelId: { [Op.in]: ids }, status: 'completed' },
            group: ['initiatorChannelId'],
            raw: true,
        }),
        TrafficMatch.findAll({
            attributes: ['targetChannelId', [fn('COUNT', col('id')), 'count']],
            where: { targetChannelId: { [Op.in]: ids }, status: 'completed' },
            group: ['targetChannelId'],
            raw: true,
        }),
        Review.findAll({
            attributes: ['toChannelId', [fn('COUNT', col('id')), 'reviewCount'], [fn('AVG', col('rating')), 'avgRating']],
            where: { toChannelId: { [Op.in]: ids } },
            group: ['toChannelId'],
            raw: true,
        }),
    ]);

    const totalByChannel = new Map();
    const completedByChannel = new Map();
    const reviewsByChannel = new Map();

    initiatedAll.forEach((row) => {
        totalByChannel.set(row.initiatorChannelId, Number(totalByChannel.get(row.initiatorChannelId) || 0) + Number(row.count || 0));
    });
    targetAll.forEach((row) => {
        totalByChannel.set(row.targetChannelId, Number(totalByChannel.get(row.targetChannelId) || 0) + Number(row.count || 0));
    });
    initiatedCompleted.forEach((row) => {
        completedByChannel.set(
            row.initiatorChannelId,
            Number(completedByChannel.get(row.initiatorChannelId) || 0) + Number(row.count || 0)
        );
    });
    targetCompleted.forEach((row) => {
        completedByChannel.set(
            row.targetChannelId,
            Number(completedByChannel.get(row.targetChannelId) || 0) + Number(row.count || 0)
        );
    });
    reviewAgg.forEach((row) => {
        reviewsByChannel.set(row.toChannelId, {
            reviewCount: Number(row.reviewCount || 0),
            avgRating: Number(Number(row.avgRating || 0).toFixed(2)),
        });
    });

    ids.forEach((channelId) => {
        const totalExchanges = Number(totalByChannel.get(channelId) || 0);
        const completedExchanges = Number(completedByChannel.get(channelId) || 0);
        const successRate = totalExchanges > 0 ? Math.round((completedExchanges / totalExchanges) * 100) : 0;
        const reviewData = reviewsByChannel.get(channelId) || { reviewCount: 0, avgRating: 0 };
        const influenceScore = Math.max(
            0,
            Math.min(100, Math.round(successRate * 0.55 + completedExchanges * 1.5 + reviewData.avgRating * 7))
        );

        stats.set(channelId, {
            completedExchanges,
            totalExchanges,
            successRate,
            reviewCount: reviewData.reviewCount,
            avgRating: reviewData.avgRating,
            influenceScore,
        });
    });

    return stats;
}

/**
 * @route GET /api/exchanges
 * @description Get completed exchanges with partner info and hasReviewed flag
 * @access Private
 * @returns {Object} exchanges[] - { id, partner, offer, completedAt, hasReviewed, myChannelId }
 */
router.get('/', auth, async (req, res) => {
    try {
        const reviewedFilter = parseReviewedFilter(req.query.reviewed);
        const sort = parseExchangeSort(req.query.sort);
        const search = String(normalizeOptionalString(req.query.search) || '').toLowerCase();
        const page = parsePositiveInt(req.query.page, 1, 1, 500);
        const limit = parsePositiveInt(req.query.limit, 12, 1, 50);

        const user = await User.findOne({ where: { firebaseUid: req.firebaseUser.uid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const channels = await YouTubeAccount.findAll({ where: { userId: user.id } });
        const channelIds = channels.map(c => c.id);

        if (channelIds.length === 0) {
            return res.json({
                exchanges: [],
                pagination: { page: 1, limit, total: 0, totalPages: 1, hasNext: false, hasPrev: false },
            });
        }

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
        const exchangesRaw = matches.map(m => {
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

        const partnerIds = exchangesRaw.map((item) => item.partner?.id).filter(Boolean);
        const partnerStatsMap = await buildPartnerStatsMap(partnerIds);

        let exchanges = exchangesRaw.map((item) => ({
            ...item,
            partnerStats: partnerStatsMap.get(item.partner?.id) || {
                completedExchanges: 0,
                totalExchanges: 0,
                successRate: 0,
                reviewCount: 0,
                avgRating: 0,
                influenceScore: 0,
            },
        }));

        if (reviewedFilter === 'reviewed') {
            exchanges = exchanges.filter((item) => item.hasReviewed);
        } else if (reviewedFilter === 'unreviewed') {
            exchanges = exchanges.filter((item) => !item.hasReviewed);
        }

        if (search) {
            exchanges = exchanges.filter((item) => {
                const haystack = [
                    item.partner?.channelTitle || '',
                    item.offer?.description || '',
                    item.offer?.type || '',
                ]
                    .join(' ')
                    .toLowerCase();
                return haystack.includes(search);
            });
        }

        if (sort === 'oldest') {
            exchanges = exchanges.sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
        } else if (sort === 'largest') {
            exchanges = exchanges.sort((a, b) => Number(b.partner?.subscribers || 0) - Number(a.partner?.subscribers || 0));
        } else if (sort === 'unreviewed_first') {
            exchanges = exchanges.sort((a, b) => Number(a.hasReviewed) - Number(b.hasReviewed));
        }

        const total = exchanges.length;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const safePage = Math.min(page, totalPages);
        const offset = (safePage - 1) * limit;
        const paged = exchanges.slice(offset, offset + limit);

        res.json({
            exchanges: paged,
            pagination: {
                page: safePage,
                limit,
                total,
                totalPages,
                hasNext: safePage < totalPages,
                hasPrev: safePage > 1,
            },
        });
    } catch (error) {
        console.error('Get exchanges error:', error);
        res.status(500).json({ error: 'Failed to get exchanges' });
    }
});

/**
 * @route POST /api/exchanges/bulk-review
 * @description Bulk leave reviews for completed exchanges where current user is participant.
 * @access Private
 */
router.post('/bulk-review', auth, async (req, res) => {
    try {
        const matchIds = Array.isArray(req.body?.matchIds) ? req.body.matchIds.filter(Boolean) : [];
        const rating = Number(req.body?.rating);
        const comment = normalizeOptionalString(req.body?.comment) || '';

        if (!matchIds.length) {
            return res.status(400).json({ error: 'Список обмінів порожній' });
        }
        if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Оцінка повинна бути від 1 до 5' });
        }
        if (comment.length > 1000) {
            return res.status(400).json({ error: 'Коментар занадто довгий (максимум 1000 символів)' });
        }

        const user = await User.findOne({ where: { firebaseUid: req.firebaseUser.uid } });
        if (!user) return res.status(404).json({ error: 'User not found' });
        const channels = await YouTubeAccount.findAll({ where: { userId: user.id } });
        const channelIds = channels.map((channel) => channel.id);

        const payload = await sequelize.transaction(async (transaction) => {
            const matches = await TrafficMatch.findAll({
                where: { id: { [Op.in]: matchIds } },
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            const byId = new Map(matches.map((match) => [match.id, match]));
            const processed = [];
            const skipped = [];

            for (const matchId of matchIds) {
                const match = byId.get(matchId);
                if (!match) {
                    skipped.push({ matchId, reason: 'not_found' });
                    continue;
                }
                if (match.status !== 'completed') {
                    skipped.push({ matchId, reason: 'invalid_status' });
                    continue;
                }

                const isInitiator = channelIds.includes(match.initiatorChannelId);
                const isTarget = channelIds.includes(match.targetChannelId);
                if (!isInitiator && !isTarget) {
                    skipped.push({ matchId, reason: 'forbidden' });
                    continue;
                }

                const fromChannelId = isInitiator ? match.initiatorChannelId : match.targetChannelId;
                const toChannelId = isInitiator ? match.targetChannelId : match.initiatorChannelId;

                const existing = await Review.findOne({
                    where: { matchId, fromChannelId },
                    transaction,
                    lock: transaction.LOCK.UPDATE,
                });
                if (existing) {
                    skipped.push({ matchId, reason: 'already_reviewed' });
                    continue;
                }

                await Review.create({
                    matchId,
                    fromChannelId,
                    toChannelId,
                    rating,
                    comment,
                }, { transaction });

                processed.push({ matchId });
            }

            await ActionLog.create({
                userId: user.id,
                action: 'exchange_review_bulk_created',
                details: {
                    requestedCount: matchIds.length,
                    processedCount: processed.length,
                    skippedCount: skipped.length,
                    rating,
                },
                ip: req.ip,
            }, { transaction });

            return { processed, skipped };
        });

        return res.json(payload);
    } catch (error) {
        console.error('Bulk exchange review error:', error);
        return res.status(500).json({ error: 'Failed to create bulk reviews' });
    }
});

module.exports = router;

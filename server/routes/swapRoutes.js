const router = require('express').Router();
const { sequelize, TrafficMatch, TrafficOffer, YouTubeAccount, User, ChatRoom, ActionLog, Review } = require('../models');
const { Op, fn, col } = require('sequelize');
const auth = require('../middleware/auth');
const { emitSwapStatusChanged, emitNotification } = require('../socketSetup');
const { normalizeOptionalString } = require('../utils/validators');

function parseIncomingStatus(value) {
    const allowed = new Set(['pending', 'accepted', 'completed', 'all']);
    const normalized = String(value || 'all').toLowerCase();
    return allowed.has(normalized) ? normalized : 'all';
}

function parseIncomingSort(value) {
    const allowed = new Set(['newest', 'largest', 'relevance']);
    const normalized = String(value || 'newest').toLowerCase();
    return allowed.has(normalized) ? normalized : 'newest';
}

function getRelevanceScore(swap) {
    const initiator = swap.initiatorChannel || {};
    const target = swap.targetChannel || {};
    const offer = swap.offer || {};
    let score = 0;

    const initiatorNiche = String(initiator.niche || '').trim().toLowerCase();
    const targetNiche = String(target.niche || '').trim().toLowerCase();
    const offerNiche = String(offer.niche || '').trim().toLowerCase();

    if (initiatorNiche && targetNiche && initiatorNiche === targetNiche) {
        score += 40;
    }
    if (offerNiche && targetNiche && offerNiche === targetNiche) {
        score += 20;
    }

    const initiatorSubs = Number(initiator.subscribers || 0);
    const targetSubs = Number(target.subscribers || 0);
    const maxSubs = Math.max(initiatorSubs, targetSubs);
    if (maxSubs > 0) {
        const closeness = 1 - Math.min(Math.abs(initiatorSubs - targetSubs) / maxSubs, 1);
        score += Math.round(closeness * 30);
    }

    if (swap.status === 'pending') {
        score += 10;
    }

    return score;
}

function getCompatibilityInsights(swap) {
    const initiator = swap.initiatorChannel || {};
    const target = swap.targetChannel || {};
    const offer = swap.offer || {};
    const reasons = [];
    let score = 0;

    const initiatorNiche = String(initiator.niche || '').trim().toLowerCase();
    const targetNiche = String(target.niche || '').trim().toLowerCase();
    if (initiatorNiche && targetNiche && initiatorNiche === targetNiche) {
        score += 35;
        reasons.push('Однакова ніша');
    }

    const initiatorLang = String(initiator.language || '').trim().toLowerCase();
    const targetLang = String(target.language || '').trim().toLowerCase();
    const offerLang = String(offer.language || '').trim().toLowerCase();
    if (initiatorLang && targetLang && initiatorLang === targetLang) {
        score += 25;
        reasons.push('Спільна мова каналів');
    } else if (offerLang && targetLang && offerLang === targetLang) {
        score += 15;
        reasons.push('Мова пропозиції збігається з вашим каналом');
    }

    const initiatorSubs = Number(initiator.subscribers || 0);
    const targetSubs = Number(target.subscribers || 0);
    const maxSubs = Math.max(initiatorSubs, targetSubs);
    if (maxSubs > 0) {
        const closeness = 1 - Math.min(Math.abs(initiatorSubs - targetSubs) / maxSubs, 1);
        const closenessPoints = Math.round(closeness * 30);
        score += closenessPoints;
        if (closeness >= 0.7) {
            reasons.push('Схожий масштаб аудиторії');
        }
    }

    if (reasons.length === 0) {
        reasons.push('Базова сумісність за метриками');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
}

function getSlaInfo(swap) {
    const createdAt = new Date(swap.createdAt);
    const nowTs = Date.now();

    if (swap.status === 'pending') {
        const deadline = new Date(createdAt.getTime() + 72 * 60 * 60 * 1000);
        const msLeft = deadline.getTime() - nowTs;
        return {
            responseDeadlineAt: deadline.toISOString(),
            hoursLeft: Math.floor(msLeft / 3600000),
            isOverdue: msLeft < 0,
        };
    }

    if (swap.status === 'accepted') {
        const deadline = new Date(createdAt.getTime() + 10 * 24 * 60 * 60 * 1000);
        const msLeft = deadline.getTime() - nowTs;
        return {
            completionDeadlineAt: deadline.toISOString(),
            daysLeft: Math.floor(msLeft / (24 * 3600000)),
            isOverdue: msLeft < 0,
        };
    }

    return {
        isOverdue: false,
    };
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
 * Get user and their channels by Firebase UID.
 * @param {string} firebaseUid
 * @returns {Promise<{user: object, channels: Array<object>, channelIds: Array<string>}|null>}
 */
async function getUserChannels(firebaseUid) {
    const user = await User.findOne({ where: { firebaseUid } });
    if (!user) return null;
    const channels = await YouTubeAccount.findAll({ where: { userId: user.id } });
    return { user, channels, channelIds: channels.map((channel) => channel.id) };
}

/**
 * @route GET /api/swaps/incoming
 * @description Get pending swap proposals targeting user's channels
 * @access Private
 */
router.get('/incoming', auth, async (req, res) => {
    try {
        const result = await getUserChannels(req.firebaseUser.uid);
        if (!result) return res.status(404).json({ error: 'User not found' });
        if (result.channelIds.length === 0) return res.json({ swaps: [] });
        const statusFilter = parseIncomingStatus(req.query.status);
        const sort = parseIncomingSort(req.query.sort);
        const search = String(normalizeOptionalString(req.query.search) || '').toLowerCase();

        const swaps = await TrafficMatch.findAll({
            where: {
                targetChannelId: { [Op.in]: result.channelIds },
                status: { [Op.in]: ['pending', 'accepted', 'completed'] },
            },
            include: [
                {
                    model: YouTubeAccount,
                    as: 'initiatorChannel',
                    attributes: ['id', 'channelId', 'channelTitle', 'channelAvatar', 'subscribers', 'niche', 'language'],
                    include: [{ model: User, as: 'owner', attributes: ['displayName', 'photoURL'] }],
                },
                {
                    model: YouTubeAccount,
                    as: 'targetChannel',
                    attributes: ['id', 'channelTitle', 'subscribers', 'niche', 'language'],
                },
                {
                    model: TrafficOffer,
                    as: 'offer',
                    attributes: ['type', 'description', 'niche', 'language'],
                },
                {
                    model: Review,
                    as: 'reviews',
                    attributes: ['id', 'fromChannelId'],
                    required: false,
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        const baseSwaps = swaps.map((swap) => {
            const plain = swap.toJSON();
            const myChannelId = plain.targetChannelId;
            const hasReviewed = Array.isArray(plain.reviews)
                ? plain.reviews.some((review) => review.fromChannelId === myChannelId)
                : false;
            return {
                ...plain,
                myChannelId,
                hasReviewed,
            };
        });

        const initiatorChannelIds = Array.from(new Set(baseSwaps.map((swap) => swap.initiatorChannelId).filter(Boolean)));
        const partnerStatsMap = await buildPartnerStatsMap(initiatorChannelIds);

        const matchIds = Array.from(new Set(baseSwaps.map((swap) => swap.id).filter(Boolean)));
        const deferLogs = await ActionLog.findAll({
            where: {
                userId: result.user.id,
                action: 'swap_deferred',
            },
            attributes: ['details', 'createdAt'],
            order: [['createdAt', 'DESC']],
            limit: 500,
        });

        const deferredMatchIds = new Set();
        deferLogs.forEach((log) => {
            const matchId = log?.details?.matchId;
            if (matchId && matchIds.includes(matchId)) {
                deferredMatchIds.add(matchId);
            }
        });

        const serialized = baseSwaps.map((swap) => {
            const compatibility = getCompatibilityInsights(swap);
            const sla = getSlaInfo(swap);
            return {
                ...swap,
                partnerStats: partnerStatsMap.get(swap.initiatorChannelId) || {
                    completedExchanges: 0,
                    totalExchanges: 0,
                    successRate: 0,
                    reviewCount: 0,
                    avgRating: 0,
                    influenceScore: 0,
                },
                compatibility,
                deferredByMe: deferredMatchIds.has(swap.id),
                relevanceScore: Math.max(getRelevanceScore(swap), compatibility.score),
                ...sla,
            };
        });

        let filtered = serialized;

        if (statusFilter !== 'all') {
            filtered = filtered.filter((swap) => swap.status === statusFilter);
        }

        if (search) {
            filtered = filtered.filter((swap) => {
                const haystack = [
                    swap.initiatorChannel?.channelTitle || '',
                    swap.initiatorChannel?.channelId || '',
                    swap.offer?.description || '',
                    swap.offer?.niche || '',
                ]
                    .join(' ')
                    .toLowerCase();
                return haystack.includes(search);
            });
        }

        if (sort === 'largest') {
            filtered = filtered.sort((a, b) => {
                const diff = Number(b.initiatorChannel?.subscribers || 0) - Number(a.initiatorChannel?.subscribers || 0);
                if (diff !== 0) return diff;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
        } else if (sort === 'relevance') {
            filtered = filtered.sort((a, b) => {
                const diff = Number(b.relevanceScore || 0) - Number(a.relevanceScore || 0);
                if (diff !== 0) return diff;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
        }

        res.json({ swaps: filtered });
    } catch (error) {
        console.error('Get incoming swaps error:', error);
        res.status(500).json({ error: 'Failed to get incoming swaps' });
    }
});

/**
 * @route GET /api/swaps/outgoing
 * @description Get swap proposals initiated by user's channels
 * @access Private
 */
router.get('/outgoing', auth, async (req, res) => {
    try {
        const result = await getUserChannels(req.firebaseUser.uid);
        if (!result) return res.status(404).json({ error: 'User not found' });
        if (result.channelIds.length === 0) return res.json({ swaps: [] });
        const statusFilter = parseIncomingStatus(req.query.status);
        const sort = parseIncomingSort(req.query.sort);
        const search = String(normalizeOptionalString(req.query.search) || '').toLowerCase();

        const swaps = await TrafficMatch.findAll({
            where: {
                initiatorChannelId: { [Op.in]: result.channelIds },
                status: { [Op.in]: ['pending', 'accepted', 'completed'] },
            },
            include: [
                {
                    model: YouTubeAccount,
                    as: 'initiatorChannel',
                    attributes: ['id', 'channelId', 'channelTitle', 'channelAvatar', 'subscribers', 'niche', 'language'],
                    include: [{ model: User, as: 'owner', attributes: ['displayName', 'photoURL'] }],
                },
                {
                    model: YouTubeAccount,
                    as: 'targetChannel',
                    attributes: ['id', 'channelId', 'channelTitle', 'channelAvatar', 'subscribers', 'niche', 'language'],
                    include: [{ model: User, as: 'owner', attributes: ['displayName', 'photoURL'] }],
                },
                {
                    model: TrafficOffer,
                    as: 'offer',
                    attributes: ['type', 'description', 'niche', 'language'],
                },
                {
                    model: Review,
                    as: 'reviews',
                    attributes: ['id', 'fromChannelId'],
                    required: false,
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        const baseSwaps = swaps.map((swap) => {
            const plain = swap.toJSON();
            const myChannelId = plain.initiatorChannelId;
            const hasReviewed = Array.isArray(plain.reviews)
                ? plain.reviews.some((review) => review.fromChannelId === myChannelId)
                : false;
            return {
                ...plain,
                myChannelId,
                hasReviewed,
            };
        });

        const targetChannelIds = Array.from(new Set(baseSwaps.map((swap) => swap.targetChannelId).filter(Boolean)));
        const partnerStatsMap = await buildPartnerStatsMap(targetChannelIds);

        const matchIds = Array.from(new Set(baseSwaps.map((swap) => swap.id).filter(Boolean)));
        const deferLogs = await ActionLog.findAll({
            where: {
                userId: result.user.id,
                action: 'swap_deferred',
            },
            attributes: ['details', 'createdAt'],
            order: [['createdAt', 'DESC']],
            limit: 500,
        });

        const deferredMatchIds = new Set();
        deferLogs.forEach((log) => {
            const matchId = log?.details?.matchId;
            if (matchId && matchIds.includes(matchId)) {
                deferredMatchIds.add(matchId);
            }
        });

        const serialized = baseSwaps.map((swap) => {
            const compatibility = getCompatibilityInsights(swap);
            const sla = getSlaInfo(swap);
            return {
                ...swap,
                partnerStats: partnerStatsMap.get(swap.targetChannelId) || {
                    completedExchanges: 0,
                    totalExchanges: 0,
                    successRate: 0,
                    reviewCount: 0,
                    avgRating: 0,
                    influenceScore: 0,
                },
                compatibility,
                deferredByMe: deferredMatchIds.has(swap.id),
                relevanceScore: Math.max(getRelevanceScore(swap), compatibility.score),
                ...sla,
            };
        });

        let filtered = serialized;

        if (statusFilter !== 'all') {
            filtered = filtered.filter((swap) => swap.status === statusFilter);
        }

        if (search) {
            filtered = filtered.filter((swap) => {
                const haystack = [
                    swap.targetChannel?.channelTitle || '',
                    swap.targetChannel?.channelId || '',
                    swap.offer?.description || '',
                    swap.offer?.niche || '',
                ]
                    .join(' ')
                    .toLowerCase();
                return haystack.includes(search);
            });
        }

        if (sort === 'largest') {
            filtered = filtered.sort((a, b) => {
                const diff = Number(b.targetChannel?.subscribers || 0) - Number(a.targetChannel?.subscribers || 0);
                if (diff !== 0) return diff;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
        } else if (sort === 'relevance') {
            filtered = filtered.sort((a, b) => {
                const diff = Number(b.relevanceScore || 0) - Number(a.relevanceScore || 0);
                if (diff !== 0) return diff;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
        }

        res.json({ swaps: filtered });
    } catch (error) {
        console.error('Get outgoing swaps error:', error);
        res.status(500).json({ error: 'Failed to get outgoing swaps' });
    }
});

/**
 * @route POST /api/swaps/:id/accept
 * @description Accept an incoming swap proposal. Auto-creates chat room.
 * @access Private (target channel owner only)
 */
router.post('/:id/accept', auth, async (req, res) => {
    try {
        const result = await getUserChannels(req.firebaseUser.uid);
        if (!result) return res.status(404).json({ error: 'User not found' });

        const payload = await sequelize.transaction(async (transaction) => {
            const match = await TrafficMatch.findByPk(req.params.id, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            if (!match) {
                return { error: { status: 404, body: { error: 'Swap not found' } } };
            }

            if (!result.channelIds.includes(match.targetChannelId)) {
                return { error: { status: 403, body: { error: 'Тільки власник цільового каналу може прийняти обмін' } } };
            }

            if (match.status !== 'pending') {
                return { error: { status: 400, body: { error: 'Обмін вже не перебуває у статусі очікування' } } };
            }

            await match.update({ status: 'accepted' }, { transaction });

            let chatRoom = await ChatRoom.findOne({
                where: { matchId: match.id },
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            if (!chatRoom) {
                chatRoom = await ChatRoom.create({ matchId: match.id }, { transaction });
            }

            await ActionLog.create({
                userId: result.user.id,
                action: 'swap_accepted',
                details: { matchId: match.id, targetChannelId: match.targetChannelId, initiatorChannelId: match.initiatorChannelId },
                ip: req.ip,
            }, { transaction });

            const initiatorChannel = await YouTubeAccount.findByPk(match.initiatorChannelId, {
                attributes: ['userId'],
                transaction,
            });

            return {
                match: match.toJSON(),
                chatRoom: chatRoom.toJSON(),
                initiatorUserId: initiatorChannel?.userId || null,
            };
        });

        if (payload.error) {
            return res.status(payload.error.status).json(payload.error.body);
        }

        res.json({ match: payload.match, chatRoom: payload.chatRoom });

        const io = req.app.get('io');
        emitSwapStatusChanged(io, payload.match, 'accepted', result.user.id);
        if (payload.initiatorUserId) {
            emitNotification(io, payload.initiatorUserId, {
                type: 'swap_accepted',
                title: 'Пропозицію прийнято',
                message: 'Вашу пропозицію обміну прийнято. Перейдіть до чату.',
                link: `/support/chats?thread=match-${payload.match.id}`,
            });
        }
    } catch (error) {
        console.error('Accept swap error:', error);
        res.status(500).json({ error: 'Failed to accept swap' });
    }
});

/**
 * @route POST /api/swaps/:id/decline
 * @description Decline or cancel a swap. Reopens the original offer.
 * @access Private (both initiator and target can decline)
 */
router.post('/:id/decline', auth, async (req, res) => {
    try {
        const result = await getUserChannels(req.firebaseUser.uid);
        if (!result) return res.status(404).json({ error: 'User not found' });
        const declineReason = normalizeOptionalString(req.body?.reason);
        if (declineReason && declineReason.length > 240) {
            return res.status(400).json({ error: 'Причина відхилення занадто довга (максимум 240 символів)' });
        }

        const payload = await sequelize.transaction(async (transaction) => {
            const match = await TrafficMatch.findByPk(req.params.id, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            if (!match) {
                return { error: { status: 404, body: { error: 'Swap not found' } } };
            }

            const isTarget = result.channelIds.includes(match.targetChannelId);
            const isInitiator = result.channelIds.includes(match.initiatorChannelId);

            if (!isTarget && !isInitiator) {
                return { error: { status: 403, body: { error: 'Не ваш обмін' } } };
            }

            if (!['pending', 'accepted'].includes(match.status)) {
                return { error: { status: 400, body: { error: 'Неможливо відхилити цей обмін у поточному статусі' } } };
            }

            await match.update({ status: 'rejected' }, { transaction });

            const offer = await TrafficOffer.findByPk(match.offerId, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            if (offer) {
                await offer.update({ status: 'open' }, { transaction });
            }

            await ActionLog.create({
                userId: result.user.id,
                action: 'swap_declined',
                details: {
                    matchId: match.id,
                    offerId: match.offerId,
                    isTarget,
                    isInitiator,
                    reason: declineReason || null,
                },
                ip: req.ip,
            }, { transaction });

            const counterChannelId = isTarget ? match.initiatorChannelId : match.targetChannelId;
            const counterChannel = await YouTubeAccount.findByPk(counterChannelId, {
                attributes: ['userId'],
                transaction,
            });

            return {
                match: match.toJSON(),
                counterUserId: counterChannel?.userId || null,
            };
        });

        if (payload.error) {
            return res.status(payload.error.status).json(payload.error.body);
        }

        res.json({ match: payload.match });

        const io = req.app.get('io');
        emitSwapStatusChanged(io, payload.match, 'rejected', result.user.id);
        if (payload.counterUserId) {
            emitNotification(io, payload.counterUserId, {
                type: 'swap_declined',
                title: 'Обмін відхилено',
                message: 'Пропозицію обміну було відхилено або скасовано.',
                link: '/swaps/outgoing',
            });
        }
    } catch (error) {
        console.error('Decline swap error:', error);
        res.status(500).json({ error: 'Failed to decline swap' });
    }
});

/**
 * @route POST /api/swaps/:id/defer
 * @description Mark incoming swap as deferred by current user (audit only, no status change)
 * @access Private (swap participant)
 */
router.post('/:id/defer', auth, async (req, res) => {
    try {
        const result = await getUserChannels(req.firebaseUser.uid);
        if (!result) return res.status(404).json({ error: 'User not found' });

        const note = normalizeOptionalString(req.body?.note);
        if (note && note.length > 240) {
            return res.status(400).json({ error: 'Коментар занадто довгий (максимум 240 символів)' });
        }

        const payload = await sequelize.transaction(async (transaction) => {
            const match = await TrafficMatch.findByPk(req.params.id, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            if (!match) {
                return { error: { status: 404, body: { error: 'Swap not found' } } };
            }

            const isParticipant = result.channelIds.includes(match.targetChannelId) || result.channelIds.includes(match.initiatorChannelId);
            if (!isParticipant) {
                return { error: { status: 403, body: { error: 'Не ваш обмін' } } };
            }

            if (!['pending', 'accepted'].includes(match.status)) {
                return { error: { status: 400, body: { error: 'Відкласти можна лише активний обмін' } } };
            }

            const deferredUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);

            await ActionLog.create({
                userId: result.user.id,
                action: 'swap_deferred',
                details: {
                    matchId: match.id,
                    note: note || null,
                    deferredUntil: deferredUntil.toISOString(),
                },
                ip: req.ip,
            }, { transaction });

            return {
                matchId: match.id,
                deferredUntil: deferredUntil.toISOString(),
            };
        });

        if (payload.error) {
            return res.status(payload.error.status).json(payload.error.body);
        }

        return res.json({
            ok: true,
            matchId: payload.matchId,
            deferredUntil: payload.deferredUntil,
        });
    } catch (error) {
        console.error('Defer swap error:', error);
        return res.status(500).json({ error: 'Failed to defer swap' });
    }
});

/**
 * @route POST /api/swaps/bulk-action
 * @description Apply bulk action for participant swaps.
 * @access Private
 */
router.post('/bulk-action', auth, async (req, res) => {
    try {
        const result = await getUserChannels(req.firebaseUser.uid);
        if (!result) return res.status(404).json({ error: 'User not found' });

        const action = String(req.body?.action || '').trim().toLowerCase();
        const matchIds = Array.isArray(req.body?.matchIds) ? req.body.matchIds.filter(Boolean) : [];
        const reason = normalizeOptionalString(req.body?.reason);

        if (!['defer', 'decline'].includes(action)) {
            return res.status(400).json({ error: 'Невідома масова дія' });
        }
        if (!matchIds.length) {
            return res.status(400).json({ error: 'Список обмінів порожній' });
        }
        if (reason && reason.length > 240) {
            return res.status(400).json({ error: 'Причина занадто довга (максимум 240 символів)' });
        }

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

                const isParticipant = result.channelIds.includes(match.targetChannelId) || result.channelIds.includes(match.initiatorChannelId);
                if (!isParticipant) {
                    skipped.push({ matchId, reason: 'forbidden' });
                    continue;
                }

                if (action === 'defer') {
                    if (!['pending', 'accepted'].includes(match.status)) {
                        skipped.push({ matchId, reason: 'invalid_status' });
                        continue;
                    }
                    const deferredUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
                    await ActionLog.create({
                        userId: result.user.id,
                        action: 'swap_deferred',
                        details: {
                            matchId: match.id,
                            reason: reason || null,
                            deferredUntil: deferredUntil.toISOString(),
                            bulk: true,
                        },
                        ip: req.ip,
                    }, { transaction });
                    processed.push({ matchId, status: match.status });
                    continue;
                }

                if (!['pending', 'accepted'].includes(match.status)) {
                    skipped.push({ matchId, reason: 'invalid_status' });
                    continue;
                }

                await match.update({ status: 'rejected' }, { transaction });
                const offer = await TrafficOffer.findByPk(match.offerId, { transaction, lock: transaction.LOCK.UPDATE });
                if (offer) {
                    await offer.update({ status: 'open' }, { transaction });
                }
                await ActionLog.create({
                    userId: result.user.id,
                    action: 'swap_declined',
                    details: {
                        matchId: match.id,
                        offerId: match.offerId,
                        reason: reason || 'bulk_action',
                        bulk: true,
                    },
                    ip: req.ip,
                }, { transaction });
                processed.push({ matchId, status: 'rejected' });
            }

            return { processed, skipped };
        });

        return res.json(payload);
    } catch (error) {
        console.error('Bulk swap action error:', error);
        return res.status(500).json({ error: 'Failed to process bulk action' });
    }
});

module.exports = router;

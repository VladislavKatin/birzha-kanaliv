const router = require('express').Router();
const { sequelize, TrafficMatch, TrafficOffer, YouTubeAccount, User, ChatRoom, ActionLog, Review } = require('../models');
const { Op } = require('sequelize');
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
                    attributes: ['id', 'channelId', 'channelTitle', 'channelAvatar', 'subscribers', 'niche'],
                    include: [{ model: User, as: 'owner', attributes: ['displayName', 'photoURL'] }],
                },
                {
                    model: YouTubeAccount,
                    as: 'targetChannel',
                    attributes: ['id', 'channelTitle', 'subscribers', 'niche'],
                },
                {
                    model: TrafficOffer,
                    as: 'offer',
                    attributes: ['type', 'description', 'niche'],
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

        const serialized = swaps.map((swap) => {
            const plain = swap.toJSON();
            const myChannelId = plain.targetChannelId;
            const hasReviewed = Array.isArray(plain.reviews)
                ? plain.reviews.some((review) => review.fromChannelId === myChannelId)
                : false;
            return {
                ...plain,
                myChannelId,
                hasReviewed,
                relevanceScore: getRelevanceScore(plain),
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

        const swaps = await TrafficMatch.findAll({
            where: {
                initiatorChannelId: { [Op.in]: result.channelIds },
                status: { [Op.in]: ['pending', 'accepted', 'completed'] },
            },
            include: [
                {
                    model: YouTubeAccount,
                    as: 'targetChannel',
                    attributes: ['id', 'channelTitle', 'channelAvatar', 'subscribers', 'niche'],
                    include: [{ model: User, as: 'owner', attributes: ['displayName', 'photoURL'] }],
                },
                {
                    model: TrafficOffer,
                    as: 'offer',
                    attributes: ['type', 'description', 'niche'],
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

        const serialized = swaps.map((swap) => {
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

        res.json({ swaps: serialized });
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

module.exports = router;

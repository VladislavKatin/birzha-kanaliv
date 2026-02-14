const router = require('express').Router();
const { sequelize, TrafficMatch, TrafficOffer, YouTubeAccount, User, ChatRoom, ActionLog } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const { emitSwapStatusChanged, emitNotification } = require('../socketSetup');

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

        const swaps = await TrafficMatch.findAll({
            where: {
                targetChannelId: { [Op.in]: result.channelIds },
                status: 'pending',
            },
            include: [
                {
                    model: YouTubeAccount,
                    as: 'initiatorChannel',
                    attributes: ['id', 'channelTitle', 'channelAvatar', 'subscribers', 'niche'],
                    include: [{ model: User, as: 'owner', attributes: ['displayName', 'photoURL'] }],
                },
                {
                    model: TrafficOffer,
                    as: 'offer',
                    attributes: ['type', 'description', 'niche'],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        res.json({ swaps });
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
                status: { [Op.in]: ['pending', 'accepted'] },
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
            ],
            order: [['createdAt', 'DESC']],
        });

        res.json({ swaps });
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
                link: `/chat/${payload.match.id}`,
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
                details: { matchId: match.id, offerId: match.offerId, isTarget, isInitiator },
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

const router = require('express').Router();
const { TrafficMatch, TrafficOffer, YouTubeAccount, User, ChatRoom, ActionLog } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const { emitSwapStatusChanged, emitNotification } = require('../socketSetup');

/**
 * Get user and their channels by Firebase UID.
 * @param {string} firebaseUid
 * @returns {Object|null} { user, channels, channelIds }
 */
async function getUserChannels(firebaseUid) {
    const user = await User.findOne({ where: { firebaseUid } });
    if (!user) return null;
    const channels = await YouTubeAccount.findAll({ where: { userId: user.id } });
    return { user, channels, channelIds: channels.map(c => c.id) };
}

/**
 * @route GET /api/swaps/incoming
 * @description Get pending swap proposals targeting user's channels
 * @access Private
 * @returns {Object} swaps[]
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
                    model: YouTubeAccount, as: 'initiatorChannel',
                    attributes: ['id', 'channelTitle', 'channelAvatar', 'subscribers', 'niche'],
                    include: [{ model: User, as: 'owner', attributes: ['displayName', 'photoURL'] }],
                },
                {
                    model: TrafficOffer, as: 'offer',
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
 * @returns {Object} swaps[]
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
                    model: YouTubeAccount, as: 'targetChannel',
                    attributes: ['id', 'channelTitle', 'channelAvatar', 'subscribers', 'niche'],
                    include: [{ model: User, as: 'owner', attributes: ['displayName', 'photoURL'] }],
                },
                {
                    model: TrafficOffer, as: 'offer',
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
 * @param {string} id - Match UUID
 * @returns {Object} match, chatRoom
 */
router.post('/:id/accept', auth, async (req, res) => {
    try {
        const result = await getUserChannels(req.firebaseUser.uid);
        if (!result) return res.status(404).json({ error: 'User not found' });

        const match = await TrafficMatch.findByPk(req.params.id);
        if (!match) return res.status(404).json({ error: 'Swap not found' });

        if (!result.channelIds.includes(match.targetChannelId)) {
            return res.status(403).json({ error: 'Тільки власник пропозиції може прийняти' });
        }

        if (match.status !== 'pending') {
            return res.status(400).json({ error: 'Обмін вже не в статусі "очікування"' });
        }

        await match.update({ status: 'accepted' });

        // Create chat room automatically
        let chatRoom = await ChatRoom.findOne({ where: { matchId: match.id } });
        if (!chatRoom) {
            chatRoom = await ChatRoom.create({ matchId: match.id });
        }

        await ActionLog.create({
            userId: result.user.id,
            action: 'swap_accepted',
            details: { matchId: match.id },
            ip: req.ip,
        });

        res.json({ match, chatRoom });

        // Real-time: notify initiator that swap was accepted
        const io = req.app.get('io');
        emitSwapStatusChanged(io, match, 'accepted', result.user.id);
        const initiatorChannel = await YouTubeAccount.findByPk(match.initiatorChannelId);
        if (initiatorChannel) {
            emitNotification(io, initiatorChannel.userId, {
                type: 'swap_accepted',
                title: 'Пропозицію прийнято!',
                message: 'Ваша пропозиція обміну була прийнята. Перейдіть до чату.',
                link: `/chat/${match.id}`,
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
 * @param {string} id - Match UUID
 * @returns {Object} match
 */
router.post('/:id/decline', auth, async (req, res) => {
    try {
        const result = await getUserChannels(req.firebaseUser.uid);
        if (!result) return res.status(404).json({ error: 'User not found' });

        const match = await TrafficMatch.findByPk(req.params.id);
        if (!match) return res.status(404).json({ error: 'Swap not found' });

        // Target can decline incoming; initiator can cancel outgoing
        const isTarget = result.channelIds.includes(match.targetChannelId);
        const isInitiator = result.channelIds.includes(match.initiatorChannelId);

        if (!isTarget && !isInitiator) {
            return res.status(403).json({ error: 'Не ваш обмін' });
        }

        if (!['pending', 'accepted'].includes(match.status)) {
            return res.status(400).json({ error: 'Неможливо відхилити цей обмін' });
        }

        await match.update({ status: 'rejected' });

        // Reopen the offer
        const offer = await TrafficOffer.findByPk(match.offerId);
        if (offer) await offer.update({ status: 'open' });

        await ActionLog.create({
            userId: result.user.id,
            action: 'swap_declined',
            details: { matchId: match.id },
            ip: req.ip,
        });

        res.json({ match });

        // Real-time: notify counterparty about decline
        const io = req.app.get('io');
        emitSwapStatusChanged(io, match, 'rejected', result.user.id);
        const counterChannelId = isTarget ? match.initiatorChannelId : match.targetChannelId;
        const counterChannel = await YouTubeAccount.findByPk(counterChannelId);
        if (counterChannel) {
            emitNotification(io, counterChannel.userId, {
                type: 'swap_declined',
                title: 'Обмін відхилено',
                message: 'Пропозиція обміну була відхилена.',
                link: '/swaps/outgoing',
            });
        }
    } catch (error) {
        console.error('Decline swap error:', error);
        res.status(500).json({ error: 'Failed to decline swap' });
    }
});

module.exports = router;

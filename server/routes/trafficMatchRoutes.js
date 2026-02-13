const router = require('express').Router();
const { TrafficMatch, TrafficOffer, YouTubeAccount, User, ActionLog } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const { emitSwapStatusChanged, emitNotification } = require('../socketSetup');

/**
 * Get user and their primary YouTube channel.
 * @param {string} firebaseUid
 * @returns {Object|null} { user, account }
 */
async function getUserChannel(firebaseUid) {
    const user = await User.findOne({ where: { firebaseUid } });
    if (!user) return null;
    const account = await YouTubeAccount.findOne({ where: { userId: user.id } });
    return { user, account };
}

/**
 * @route GET /api/matches
 * @description List all matches for user's channel (all statuses)
 * @access Private
 * @returns {Object} matches[], myChannelId
 */
router.get('/', auth, async (req, res) => {
    try {
        const result = await getUserChannel(req.firebaseUser.uid);
        if (!result?.account) return res.status(404).json({ error: 'No channel connected' });

        const matches = await TrafficMatch.findAll({
            where: {
                [Op.or]: [
                    { initiatorChannelId: result.account.id },
                    { targetChannelId: result.account.id },
                ],
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
                    attributes: ['type', 'description', 'niche'],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        res.json({
            matches,
            myChannelId: result.account.id,
        });
    } catch (error) {
        console.error('List matches error:', error);
        res.status(500).json({ error: 'Failed to list matches' });
    }
});

/**
 * @route PUT /api/matches/:id/accept
 * @description Accept a pending match (target channel owner)
 * @access Private
 * @param {string} id - Match UUID
 * @returns {Object} match
 */
router.put('/:id/accept', auth, async (req, res) => {
    try {
        const result = await getUserChannel(req.firebaseUser.uid);
        if (!result?.account) return res.status(404).json({ error: 'No channel connected' });

        const match = await TrafficMatch.findByPk(req.params.id);
        if (!match) return res.status(404).json({ error: 'Match not found' });

        // Only the target (offer creator) can accept
        if (match.targetChannelId !== result.account.id) {
            return res.status(403).json({ error: 'Тільки власник пропозиції може прийняти' });
        }

        if (match.status !== 'pending') {
            return res.status(400).json({ error: 'Обмін вже не в статусі "очікування"' });
        }

        await match.update({ status: 'accepted' });

        await ActionLog.create({
            userId: result.user.id,
            action: 'match_accepted',
            details: { matchId: match.id },
            ip: req.ip,
        });

        res.json({ match });

        // Real-time: notify initiator
        const io = req.app.get('io');
        emitSwapStatusChanged(io, match, 'accepted', result.user.id);
        const initiatorChannel = await YouTubeAccount.findByPk(match.initiatorChannelId);
        if (initiatorChannel) {
            emitNotification(io, initiatorChannel.userId, {
                type: 'match_accepted',
                title: 'Обмін прийнято!',
                message: 'Ваш обмін було прийнято.',
                link: '/swaps/outgoing',
            });
        }
    } catch (error) {
        console.error('Accept match error:', error);
        res.status(500).json({ error: 'Failed to accept match' });
    }
});

/**
 * @route PUT /api/matches/:id/reject
 * @description Reject a match. Reopens the original offer.
 * @access Private (both sides can reject)
 * @param {string} id - Match UUID
 * @returns {Object} match
 */
router.put('/:id/reject', auth, async (req, res) => {
    try {
        const result = await getUserChannel(req.firebaseUser.uid);
        if (!result?.account) return res.status(404).json({ error: 'No channel connected' });

        const match = await TrafficMatch.findByPk(req.params.id);
        if (!match) return res.status(404).json({ error: 'Match not found' });

        // Both sides can reject
        if (match.targetChannelId !== result.account.id && match.initiatorChannelId !== result.account.id) {
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
            action: 'match_rejected',
            details: { matchId: match.id },
            ip: req.ip,
        });

        res.json({ match });

        // Real-time: notify counterparty
        const io = req.app.get('io');
        emitSwapStatusChanged(io, match, 'rejected', result.user.id);
        const counterChannelId = match.targetChannelId === result.account.id
            ? match.initiatorChannelId : match.targetChannelId;
        const counterChannel = await YouTubeAccount.findByPk(counterChannelId);
        if (counterChannel) {
            emitNotification(io, counterChannel.userId, {
                type: 'match_rejected',
                title: 'Обмін відхилено',
                message: 'Пропозицію обміну було відхилено.',
                link: '/swaps/outgoing',
            });
        }
    } catch (error) {
        console.error('Reject match error:', error);
        res.status(500).json({ error: 'Failed to reject match' });
    }
});

/**
 * @route PUT /api/matches/:id/confirm
 * @description Confirm exchange completion from one side. Auto-completes when both confirm.
 * @access Private (both sides)
 * @param {string} id - Match UUID
 * @returns {Object} match
 */
router.put('/:id/confirm', auth, async (req, res) => {
    try {
        const result = await getUserChannel(req.firebaseUser.uid);
        if (!result?.account) return res.status(404).json({ error: 'No channel connected' });

        const match = await TrafficMatch.findByPk(req.params.id);
        if (!match) return res.status(404).json({ error: 'Match not found' });

        if (match.status !== 'accepted') {
            return res.status(400).json({ error: 'Обмін має бути прийнятий для підтвердження' });
        }

        const isInitiator = match.initiatorChannelId === result.account.id;
        const isTarget = match.targetChannelId === result.account.id;

        if (!isInitiator && !isTarget) {
            return res.status(403).json({ error: 'Не ваш обмін' });
        }

        // Update confirmation flag
        if (isInitiator) {
            await match.update({ initiatorConfirmed: true });
        } else {
            await match.update({ targetConfirmed: true });
        }

        // Reload to check both flags
        await match.reload();

        // If both confirmed, mark as completed
        if (match.initiatorConfirmed && match.targetConfirmed) {
            await match.update({
                status: 'completed',
                completedAt: new Date(),
            });

            // Update offer status
            const offer = await TrafficOffer.findByPk(match.offerId);
            if (offer) await offer.update({ status: 'completed' });
        }

        await ActionLog.create({
            userId: result.user.id,
            action: 'match_confirmed',
            details: {
                matchId: match.id,
                side: isInitiator ? 'initiator' : 'target',
                bothConfirmed: match.initiatorConfirmed && match.targetConfirmed,
            },
            ip: req.ip,
        });

        res.json({ match });

        // Real-time: emit status change
        const io = req.app.get('io');
        if (match.status === 'completed') {
            emitSwapStatusChanged(io, match, 'completed', result.user.id);
            const counterChannelId = isInitiator ? match.targetChannelId : match.initiatorChannelId;
            const counterChannel = await YouTubeAccount.findByPk(counterChannelId);
            if (counterChannel) {
                emitNotification(io, counterChannel.userId, {
                    type: 'exchange_completed',
                    title: 'Обмін завершено! 🎉',
                    message: 'Обидві сторони підтвердили обмін. Залиште відгук!',
                    link: '/exchanges',
                });
            }
        } else {
            // One side confirmed, notify the other
            const counterChannelId = isInitiator ? match.targetChannelId : match.initiatorChannelId;
            const counterChannel = await YouTubeAccount.findByPk(counterChannelId);
            if (counterChannel) {
                emitNotification(io, counterChannel.userId, {
                    type: 'match_confirmed_partial',
                    title: 'Партнер підтвердив',
                    message: 'Партнер підтвердив виконання. Підтвердіть зі свого боку.',
                    link: '/swaps/outgoing',
                });
            }
        }
    } catch (error) {
        console.error('Confirm match error:', error);
        res.status(500).json({ error: 'Failed to confirm match' });
    }
});

module.exports = router;

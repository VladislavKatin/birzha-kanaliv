const router = require('express').Router();
const { sequelize, TrafficMatch, TrafficOffer, YouTubeAccount, User, ActionLog } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const { emitSwapStatusChanged, emitNotification } = require('../socketSetup');
const { getUserChannelsByFirebaseUid } = require('../services/channelAccessService');
const { completeMatchInTransaction } = require('../services/chatCompletionService');

router.get('/', auth, async (req, res) => {
    try {
        const result = await getUserChannelsByFirebaseUid({
            User,
            YouTubeAccount,
            firebaseUid: req.firebaseUser.uid,
        });

        if (!result) return res.status(404).json({ error: 'User not found' });
        if (result.channelIds.length === 0) return res.status(404).json({ error: 'No channel connected' });

        const matches = await TrafficMatch.findAll({
            where: {
                [Op.or]: [
                    { initiatorChannelId: { [Op.in]: result.channelIds } },
                    { targetChannelId: { [Op.in]: result.channelIds } },
                ],
            },
            include: [
                {
                    model: YouTubeAccount,
                    as: 'initiatorChannel',
                    attributes: ['id', 'channelTitle', 'channelAvatar', 'subscribers'],
                    include: [{ model: User, as: 'owner', attributes: ['displayName', 'photoURL'] }],
                },
                {
                    model: YouTubeAccount,
                    as: 'targetChannel',
                    attributes: ['id', 'channelTitle', 'channelAvatar', 'subscribers'],
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

        res.json({
            matches,
            myChannelIds: result.channelIds,
            myChannelId: result.channelIds[0] || null,
        });
    } catch (error) {
        console.error('List matches error:', error);
        res.status(500).json({ error: 'Failed to list matches' });
    }
});

router.put('/:id/accept', auth, async (req, res) => {
    try {
        const result = await getUserChannelsByFirebaseUid({
            User,
            YouTubeAccount,
            firebaseUid: req.firebaseUser.uid,
        });

        if (!result) return res.status(404).json({ error: 'User not found' });
        if (result.channelIds.length === 0) return res.status(404).json({ error: 'No channel connected' });

        const match = await TrafficMatch.findByPk(req.params.id);
        if (!match) return res.status(404).json({ error: 'Match not found' });

        if (!result.channelIds.includes(match.targetChannelId)) {
            return res.status(403).json({ error: 'Only target channel owner can accept' });
        }

        if (match.status !== 'pending') {
            return res.status(400).json({ error: 'Match is not pending' });
        }

        const transaction = await sequelize.transaction();
        try {
            await match.update({ status: 'accepted' }, { transaction });
            await ActionLog.create({
                userId: result.user.id,
                action: 'match_accepted',
                details: { matchId: match.id },
                ip: req.ip,
            }, { transaction });
            await transaction.commit();
        } catch (txError) {
            await transaction.rollback();
            throw txError;
        }

        res.json({ match });

        const io = req.app.get('io');
        emitSwapStatusChanged(io, match, 'accepted', result.user.id);
        const initiatorChannel = await YouTubeAccount.findByPk(match.initiatorChannelId);
        if (initiatorChannel) {
            emitNotification(io, initiatorChannel.userId, {
                type: 'match_accepted',
                title: 'Exchange accepted',
                message: 'Your exchange request was accepted.',
                link: '/swaps/outgoing',
            });
        }
    } catch (error) {
        console.error('Accept match error:', error);
        res.status(500).json({ error: 'Failed to accept match' });
    }
});

router.put('/:id/reject', auth, async (req, res) => {
    try {
        const result = await getUserChannelsByFirebaseUid({
            User,
            YouTubeAccount,
            firebaseUid: req.firebaseUser.uid,
        });

        if (!result) return res.status(404).json({ error: 'User not found' });
        if (result.channelIds.length === 0) return res.status(404).json({ error: 'No channel connected' });

        const match = await TrafficMatch.findByPk(req.params.id);
        if (!match) return res.status(404).json({ error: 'Match not found' });

        const isTarget = result.channelIds.includes(match.targetChannelId);
        const isInitiator = result.channelIds.includes(match.initiatorChannelId);
        if (!isTarget && !isInitiator) {
            return res.status(403).json({ error: 'Not your match' });
        }

        if (!['pending', 'accepted'].includes(match.status)) {
            return res.status(400).json({ error: 'Cannot reject this match' });
        }

        const transaction = await sequelize.transaction();
        try {
            await match.update({ status: 'rejected' }, { transaction });
            const offer = await TrafficOffer.findByPk(match.offerId, { transaction });
            if (offer) await offer.update({ status: 'open' }, { transaction });

            await ActionLog.create({
                userId: result.user.id,
                action: 'match_rejected',
                details: { matchId: match.id },
                ip: req.ip,
            }, { transaction });
            await transaction.commit();
        } catch (txError) {
            await transaction.rollback();
            throw txError;
        }

        res.json({ match });

        const io = req.app.get('io');
        emitSwapStatusChanged(io, match, 'rejected', result.user.id);
        const counterChannelId = isTarget ? match.initiatorChannelId : match.targetChannelId;
        const counterChannel = await YouTubeAccount.findByPk(counterChannelId);
        if (counterChannel) {
            emitNotification(io, counterChannel.userId, {
                type: 'match_rejected',
                title: 'Exchange rejected',
                message: 'Your exchange request was rejected.',
                link: '/swaps/outgoing',
            });
        }
    } catch (error) {
        console.error('Reject match error:', error);
        res.status(500).json({ error: 'Failed to reject match' });
    }
});

router.put('/:id/confirm', auth, async (req, res) => {
    try {
        const result = await getUserChannelsByFirebaseUid({
            User,
            YouTubeAccount,
            firebaseUid: req.firebaseUser.uid,
        });

        if (!result) return res.status(404).json({ error: 'User not found' });
        if (result.channelIds.length === 0) return res.status(404).json({ error: 'No channel connected' });

        const match = await TrafficMatch.findByPk(req.params.id);
        if (!match) return res.status(404).json({ error: 'Match not found' });

        if (match.status !== 'accepted') {
            return res.status(400).json({ error: 'Match must be accepted before confirmation' });
        }

        const isInitiator = result.channelIds.includes(match.initiatorChannelId);
        const isTarget = result.channelIds.includes(match.targetChannelId);
        if (!isInitiator && !isTarget) {
            return res.status(403).json({ error: 'Not your match' });
        }

        await completeMatchInTransaction({
            match,
            isInitiator,
            actorUserId: result.user.id,
            ip: req.ip,
            sequelize,
            TrafficOffer,
            ActionLog,
        });

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

        const io = req.app.get('io');
        if (match.status === 'completed') {
            emitSwapStatusChanged(io, match, 'completed', result.user.id);
            const counterChannelId = isInitiator ? match.targetChannelId : match.initiatorChannelId;
            const counterChannel = await YouTubeAccount.findByPk(counterChannelId);
            if (counterChannel) {
                emitNotification(io, counterChannel.userId, {
                    type: 'exchange_completed',
                    title: 'Exchange completed',
                    message: 'Both sides confirmed the exchange.',
                    link: '/exchanges',
                });
            }
        } else {
            const counterChannelId = isInitiator ? match.targetChannelId : match.initiatorChannelId;
            const counterChannel = await YouTubeAccount.findByPk(counterChannelId);
            if (counterChannel) {
                emitNotification(io, counterChannel.userId, {
                    type: 'match_confirmed_partial',
                    title: 'Partner confirmed',
                    message: 'Partner confirmed completion. Please confirm from your side.',
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

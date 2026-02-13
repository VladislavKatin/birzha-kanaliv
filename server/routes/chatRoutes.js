const router = require('express').Router();
const { sequelize, ChatRoom, Message, TrafficMatch, TrafficOffer, YouTubeAccount, User, ActionLog } = require('../models');
const auth = require('../middleware/auth');
const { completeMatchInTransaction } = require('../services/chatCompletionService');
const { logInfo, logError } = require('../services/logger');

/**
 * Verify that a user is a participant in a traffic match.
 * @param {string} firebaseUid - Firebase UID
 * @param {string} matchId - Match UUID
 * @returns {Object|null} { user, match, channelIds } or null
 */
async function verifyMatchParticipant(firebaseUid, matchId) {
    const user = await User.findOne({ where: { firebaseUid } });
    if (!user) return null;

    const channels = await YouTubeAccount.findAll({ where: { userId: user.id } });
    const channelIds = channels.map(c => c.id);

    const match = await TrafficMatch.findByPk(matchId);
    if (!match) return null;

    const isParticipant = channelIds.includes(match.initiatorChannelId) || channelIds.includes(match.targetChannelId);
    if (!isParticipant) return null;

    return { user, match, channelIds };
}

/**
 * @route GET /api/chat/:matchId/messages
 * @description Get all messages for a match chat, with partner info
 * @access Private (match participants only)
 * @param {string} matchId - Match UUID
 * @returns {Object} chatRoom, messages[], match, partner, myUserId
 */
router.get('/:matchId/messages', auth, async (req, res) => {
    try {
        const result = await verifyMatchParticipant(req.firebaseUser.uid, req.params.matchId);
        if (!result) return res.status(403).json({ error: 'Access denied' });

        let chatRoom = await ChatRoom.findOne({ where: { matchId: req.params.matchId } });
        if (!chatRoom) {
            chatRoom = await ChatRoom.create({ matchId: req.params.matchId });
        }

        const messages = await Message.findAll({
            where: { chatRoomId: chatRoom.id },
            include: [
                { model: User, as: 'sender', attributes: ['id', 'displayName', 'photoURL'] },
            ],
            order: [['createdAt', 'ASC']],
        });

        // Get partner info
        const { match } = result;
        const partnerId = result.channelIds.includes(match.initiatorChannelId)
            ? match.targetChannelId
            : match.initiatorChannelId;

        const partnerChannel = await YouTubeAccount.findByPk(partnerId, {
            attributes: ['channelTitle', 'channelAvatar'],
            include: [{ model: User, as: 'owner', attributes: ['displayName', 'photoURL'] }],
        });

        res.json({
            chatRoom,
            messages,
            match: {
                id: match.id,
                status: match.status,
                initiatorConfirmed: match.initiatorConfirmed,
                targetConfirmed: match.targetConfirmed,
            },
            partner: partnerChannel,
            myUserId: result.user.id,
        });
        logInfo('chat.messages.loaded', {
            matchId: req.params.matchId,
            userId: result.user.id,
            messageCount: messages.length,
        });
    } catch (error) {
        logError('chat.messages.load.failed', {
            matchId: req.params?.matchId || null,
            firebaseUid: req.firebaseUser?.uid || null,
            error,
        });
        res.status(500).json({ error: 'Failed to get messages' });
    }
});

/**
 * @route POST /api/chat/:matchId/messages
 * @description Send a message via REST (fallback for Socket.io)
 * @access Private (match participants only)
 * @param {string} matchId - Match UUID
 * @param {string} content - Message text
 * @returns {Object} message
 */
router.post('/:matchId/messages', auth, async (req, res) => {
    try {
        const result = await verifyMatchParticipant(req.firebaseUser.uid, req.params.matchId);
        if (!result) return res.status(403).json({ error: 'Access denied' });

        const { content } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Повідомлення не може бути порожнім' });
        }

        let chatRoom = await ChatRoom.findOne({ where: { matchId: req.params.matchId } });
        if (!chatRoom) {
            chatRoom = await ChatRoom.create({ matchId: req.params.matchId });
        }

        const message = await Message.create({
            chatRoomId: chatRoom.id,
            senderUserId: result.user.id,
            content: content.trim(),
        });

        const fullMessage = await Message.findByPk(message.id, {
            include: [{ model: User, as: 'sender', attributes: ['id', 'displayName', 'photoURL'] }],
        });

        res.status(201).json({ message: fullMessage });
        logInfo('chat.message.sent', {
            matchId: req.params.matchId,
            senderUserId: result.user.id,
            messageId: message.id,
        });
    } catch (error) {
        logError('chat.message.send.failed', {
            matchId: req.params?.matchId || null,
            firebaseUid: req.firebaseUser?.uid || null,
            error,
        });
        res.status(500).json({ error: 'Failed to send message' });
    }
});

/**
 * @route POST /api/chat/:matchId/complete
 * @description Confirm deal completion from one side. Both sides must confirm.
 * @access Private (match participants only)
 * @param {string} matchId - Match UUID
 * @returns {Object} match { id, status, initiatorConfirmed, targetConfirmed }
 */
router.post('/:matchId/complete', auth, async (req, res) => {
    try {
        const result = await verifyMatchParticipant(req.firebaseUser.uid, req.params.matchId);
        if (!result) return res.status(403).json({ error: 'Access denied' });

        const { match, channelIds } = result;

        if (match.status !== 'accepted') {
            return res.status(400).json({ error: 'Обмін має бути прийнятий для завершення' });
        }

        const isInitiator = channelIds.includes(match.initiatorChannelId);

        await completeMatchInTransaction({
            match,
            isInitiator,
            actorUserId: result.user.id,
            ip: req.ip,
            sequelize,
            TrafficOffer,
            ActionLog,
        });

        res.json({
            match: {
                id: match.id,
                status: match.status,
                initiatorConfirmed: match.initiatorConfirmed,
                targetConfirmed: match.targetConfirmed,
            },
        });
        logInfo('chat.deal.complete.confirmed', {
            matchId: match.id,
            userId: result.user.id,
            status: match.status,
            initiatorConfirmed: match.initiatorConfirmed,
            targetConfirmed: match.targetConfirmed,
        });
    } catch (error) {
        logError('chat.deal.complete.failed', {
            matchId: req.params?.matchId || null,
            firebaseUid: req.firebaseUser?.uid || null,
            error,
        });
        res.status(500).json({ error: 'Failed to complete deal' });
    }
});

module.exports = router;

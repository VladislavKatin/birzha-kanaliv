const router = require('express').Router();
const { sequelize, ChatRoom, Message, TrafficMatch, TrafficOffer, YouTubeAccount, User, ActionLog } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const { completeMatchInTransaction } = require('../services/chatCompletionService');
const { normalizeIncomingMessagePayload, formatMessageForClient } = require('../services/chatMessagePayload');
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
    const channelIds = channels.map((channel) => channel.id);

    const match = await TrafficMatch.findByPk(matchId);
    if (!match) return null;

    const isParticipant = channelIds.includes(match.initiatorChannelId) || channelIds.includes(match.targetChannelId);
    if (!isParticipant) return null;

    return { user, match, channelIds };
}

/**
 * @route GET /api/chat/threads
 * @description Get all chat threads for current user
 * @access Private
 */
router.get('/threads', auth, async (req, res) => {
    try {
        const user = await User.findOne({ where: { firebaseUid: req.firebaseUser.uid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const channels = await YouTubeAccount.findAll({
            where: { userId: user.id },
            attributes: ['id'],
        });
        const channelIds = channels.map((channel) => channel.id);
        if (channelIds.length === 0) return res.json({ threads: [] });

        const matches = await TrafficMatch.findAll({
            where: {
                [Op.or]: [
                    { initiatorChannelId: { [Op.in]: channelIds } },
                    { targetChannelId: { [Op.in]: channelIds } },
                ],
                status: { [Op.in]: ['pending', 'accepted', 'completed'] },
            },
            include: [
                {
                    model: YouTubeAccount,
                    as: 'initiatorChannel',
                    attributes: ['id', 'channelTitle', 'channelAvatar'],
                    include: [{ model: User, as: 'owner', attributes: ['displayName', 'photoURL'] }],
                },
                {
                    model: YouTubeAccount,
                    as: 'targetChannel',
                    attributes: ['id', 'channelTitle', 'channelAvatar'],
                    include: [{ model: User, as: 'owner', attributes: ['displayName', 'photoURL'] }],
                },
                {
                    model: ChatRoom,
                    as: 'chatRoom',
                    attributes: ['id'],
                    required: false,
                },
            ],
            order: [['updatedAt', 'DESC']],
        });

        const threads = await Promise.all(matches.map(async (match) => {
            const isInitiator = channelIds.includes(match.initiatorChannelId);
            const partner = isInitiator ? match.targetChannel : match.initiatorChannel;
            const chatRoomId = match.chatRoom?.id || null;

            let lastMessage = null;
            if (chatRoomId) {
                const message = await Message.findOne({
                    where: { chatRoomId },
                    include: [{ model: User, as: 'sender', attributes: ['id', 'displayName', 'photoURL'] }],
                    order: [['createdAt', 'DESC']],
                });
                if (message) {
                    lastMessage = formatMessageForClient(message);
                }
            }

            return {
                id: `match-${match.id}`,
                type: 'match',
                matchId: match.id,
                status: match.status,
                partner: partner
                    ? {
                        channelTitle: partner.channelTitle,
                        channelAvatar: partner.channelAvatar,
                        owner: partner.owner
                            ? {
                                displayName: partner.owner.displayName,
                                photoURL: partner.owner.photoURL,
                            }
                            : null,
                    }
                    : null,
                lastMessage,
                lastMessageAt: lastMessage?.createdAt || match.updatedAt,
            };
        }));

        threads.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
        return res.json({ threads });
    } catch (error) {
        logError('chat.threads.load.failed', {
            firebaseUid: req.firebaseUser?.uid || null,
            error,
        });
        return res.status(500).json({ error: 'Failed to load chat threads' });
    }
});
/**
 * @route GET /api/chat/:matchId/messages
 * @description Get all messages for a match chat, with partner info
 * @access Private (match participants only)
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
            include: [{ model: User, as: 'sender', attributes: ['id', 'displayName', 'photoURL'] }],
            order: [['createdAt', 'ASC']],
        });
        const normalizedMessages = messages.map(formatMessageForClient);

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
            messages: normalizedMessages,
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
            messageCount: normalizedMessages.length,
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
 */
router.post('/:matchId/messages', auth, async (req, res) => {
    try {
        const result = await verifyMatchParticipant(req.firebaseUser.uid, req.params.matchId);
        if (!result) return res.status(403).json({ error: 'Access denied' });

        let payload;
        try {
            payload = normalizeIncomingMessagePayload(req.body || {});
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }

        const fullMessage = await sequelize.transaction(async (transaction) => {
            let chatRoom = await ChatRoom.findOne({
                where: { matchId: req.params.matchId },
                transaction,
            });

            if (!chatRoom) {
                chatRoom = await ChatRoom.create({ matchId: req.params.matchId }, { transaction });
            }

            const message = await Message.create({
                chatRoomId: chatRoom.id,
                senderUserId: result.user.id,
                content: payload.storedContent,
            }, { transaction });

            await ActionLog.create({
                userId: result.user.id,
                action: 'chat_message_sent',
                details: {
                    matchId: req.params.matchId,
                    messageId: message.id,
                    hasImage: !!payload.imageData,
                },
                ip: req.ip,
            }, { transaction });

            const createdMessage = await Message.findByPk(message.id, {
                include: [{ model: User, as: 'sender', attributes: ['id', 'displayName', 'photoURL'] }],
                transaction,
            });

            return formatMessageForClient(createdMessage);
        });

        res.status(201).json({ message: fullMessage });
        logInfo('chat.message.sent', {
            matchId: req.params.matchId,
            senderUserId: result.user.id,
            messageId: fullMessage.id,
            hasImage: !!fullMessage.imageData,
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



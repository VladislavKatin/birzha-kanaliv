const router = require('express').Router();
const { Op } = require('sequelize');
const { sequelize, User, ActionLog } = require('../models');
const auth = require('../middleware/auth');
const { normalizeIncomingMessagePayload } = require('../services/chatMessagePayload');
const { logInfo, logError } = require('../services/logger');
const { emitSupportMessage } = require('../socketSetup');

function mapSupportLogToMessage(log) {
    const details = log.details || {};
    return {
        id: log.id,
        content: details.text || '',
        imageData: details.imageData || null,
        createdAt: log.createdAt,
        sender: {
            id: log.user?.id || null,
            displayName: log.user?.displayName || 'Користувач',
            photoURL: log.user?.photoURL || null,
            role: log.user?.role || 'user',
        },
        isAdmin: log.user?.role === 'admin',
    };
}

router.get('/chat', auth, async (req, res) => {
    try {
        const payload = await sequelize.transaction(async (transaction) => {
            const user = await User.findOne({
                where: { firebaseUid: req.firebaseUser.uid },
                transaction,
            });

            if (!user) {
                return { user: null, messages: [] };
            }

            const adminUsers = await User.findAll({
                where: { role: 'admin' },
                attributes: ['id'],
                transaction,
            });
            const adminIds = adminUsers.map((admin) => admin.id);
            const visibleUserIds = user.role === 'admin'
                ? null
                : Array.from(new Set([user.id, ...adminIds]));

            const logs = await ActionLog.findAll({
                where: {
                    action: 'support_chat_message',
                    ...(visibleUserIds ? { userId: { [Op.in]: visibleUserIds } } : {}),
                },
                include: [{ model: User, as: 'user', attributes: ['id', 'displayName', 'photoURL', 'role'] }],
                order: [['createdAt', 'ASC']],
                limit: 250,
                transaction,
            });

            const filteredLogs = logs.filter((log) => {
                if (user.role === 'admin') {
                    return true;
                }

                if (log.userId === user.id) {
                    return true;
                }

                const senderIsAdmin = log.user?.role === 'admin';
                if (!senderIsAdmin) {
                    return false;
                }

                const targetUserId = log.details?.targetUserId || null;
                return !targetUserId || targetUserId === user.id;
            });

            await ActionLog.create({
                userId: user.id,
                action: 'support_chat_opened',
                details: { scope: 'support_chat' },
                ip: req.ip,
            }, { transaction });

            return {
                user,
                messages: filteredLogs.map(mapSupportLogToMessage),
            };
        });

        if (!payload.user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            messages: payload.messages,
            myUserId: payload.user.id,
            adminWelcome: {
                id: 'support-admin-welcome',
                content: 'Вітаємо в чаті адміністрації. Опишіть проблему або пропозицію, можна додати скріншот.',
                imageData: null,
                createdAt: new Date(0).toISOString(),
                sender: {
                    id: 'admin-system',
                    displayName: 'Адміністрація',
                    photoURL: null,
                    role: 'admin',
                },
                isAdmin: true,
                isSystem: true,
            },
        });

        logInfo('support.chat.loaded', {
            firebaseUid: req.firebaseUser.uid,
            messageCount: payload.messages.length,
        });
    } catch (error) {
        logError('support.chat.load.failed', {
            firebaseUid: req.firebaseUser?.uid || null,
            error,
        });
        res.status(500).json({ error: 'Failed to load support chat' });
    }
});

router.post('/chat/messages', auth, async (req, res) => {
    try {
        let incoming;
        try {
            incoming = normalizeIncomingMessagePayload(req.body || {});
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }

        const payload = await sequelize.transaction(async (transaction) => {
            const user = await User.findOne({
                where: { firebaseUid: req.firebaseUser.uid },
                transaction,
            });

            if (!user) {
                return { user: null, message: null };
            }

            const log = await ActionLog.create({
                userId: user.id,
                action: 'support_chat_message',
                details: {
                    text: incoming.text || '',
                    imageData: incoming.imageData || null,
                },
                ip: req.ip,
            }, { transaction });

            const fullLog = await ActionLog.findByPk(log.id, {
                include: [{ model: User, as: 'user', attributes: ['id', 'displayName', 'photoURL', 'role'] }],
                transaction,
            });

            const adminUsers = await User.findAll({
                where: { role: 'admin' },
                attributes: ['id'],
                transaction,
            });

            return {
                user,
                message: mapSupportLogToMessage(fullLog),
                adminIds: adminUsers.map((item) => item.id),
            };
        });

        if (!payload.user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(201).json({ message: payload.message });

        const io = req.app.get('io');
        const targetUsers = Array.from(new Set([payload.user.id, ...(payload.adminIds || [])]));
        emitSupportMessage(io, targetUsers, payload.message);

        logInfo('support.chat.message.sent', {
            firebaseUid: req.firebaseUser.uid,
            userId: payload.user.id,
            messageId: payload.message.id,
            hasImage: !!payload.message.imageData,
        });
    } catch (error) {
        logError('support.chat.message.failed', {
            firebaseUid: req.firebaseUser?.uid || null,
            error,
        });
        res.status(500).json({ error: 'Failed to send support message' });
    }
});

module.exports = router;

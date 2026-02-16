const admin = require('./config/firebase');
const { sequelize, ChatRoom, Message, User, YouTubeAccount, TrafficMatch, ActionLog } = require('./models');
const { normalizeIncomingMessagePayload, formatMessageForClient } = require('./services/chatMessagePayload');
const { getAllowedClientOrigins } = require('./config/clientOrigins');

/** @type {Map<string, Set<string>>} userId → Set of socket IDs */
const onlineUsers = new Map();

/**
 * Set up Socket.io server with authentication, chat, presence, and notification events.
 * @param {import('http').Server} server
 * @returns {import('socket.io').Server}
 */
function setupSocket(server) {
    const { Server } = require('socket.io');
    const allowedOrigins = getAllowedClientOrigins();

    const io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    // ── Authentication middleware ──────────────────────────
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token) {
                return next(new Error('Authentication required'));
            }

            if (!admin.apps.length) {
                return next(new Error('Auth service not configured'));
            }

            const decoded = await admin.auth().verifyIdToken(token);
            const user = await User.findOne({ where: { firebaseUid: decoded.uid } });
            if (!user) return next(new Error('User not found'));

            socket.userId = user.id;
            socket.firebaseUid = decoded.uid;
            next();
        } catch (error) {
            console.error('Socket auth error:', error.message);
            next(new Error('Authentication failed'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Socket connected: ${socket.userId}`);

        // ── Presence: user:online ─────────────────────────
        if (!onlineUsers.has(socket.userId)) {
            onlineUsers.set(socket.userId, new Set());
        }
        onlineUsers.get(socket.userId).add(socket.id);

        // Only broadcast if this is the first connection for this user
        if (onlineUsers.get(socket.userId).size === 1) {
            socket.broadcast.emit('user:online', { userId: socket.userId });
        }

        // Join user's personal notification room
        socket.join(`user:${socket.userId}`);
        socket.join(`support:${socket.userId}`);

        // ── Join match/transaction room ───────────────────
        socket.on('join:transaction', async (matchId) => {
            try {
                const channels = await YouTubeAccount.findAll({ where: { userId: socket.userId } });
                const channelIds = channels.map(c => c.id);
                const match = await TrafficMatch.findByPk(matchId);

                if (!match || (!channelIds.includes(match.initiatorChannelId) && !channelIds.includes(match.targetChannelId))) {
                    socket.emit('error', { message: 'Access denied' });
                    return;
                }

                const room = `match:${matchId}`;
                socket.join(room);
                socket.currentRoom = room;
                socket.currentMatchId = matchId;
                console.log(`  📌 ${socket.userId} joined room ${room}`);
            } catch (error) {
                console.error('Join room error:', error);
                socket.emit('error', { message: 'Failed to join room' });
            }
        });

        // ── Chat: send message ────────────────────────────
        socket.on('send:message', async (data) => {
            try {
                const { matchId } = data || {};
                const payload = normalizeIncomingMessagePayload(data || {});
                if (!matchId) return;

                const fullMessage = await sequelize.transaction(async (transaction) => {
                    let chatRoom = await ChatRoom.findOne({ where: { matchId }, transaction });
                    if (!chatRoom) {
                        chatRoom = await ChatRoom.create({ matchId }, { transaction });
                    }

                    const message = await Message.create({
                        chatRoomId: chatRoom.id,
                        senderUserId: socket.userId,
                        content: payload.storedContent,
                    }, { transaction });

                    await ActionLog.create({
                        userId: socket.userId,
                        action: 'chat_message_sent',
                        details: {
                            matchId,
                            messageId: message.id,
                            hasImage: !!payload.imageData,
                            source: 'socket',
                        },
                    }, { transaction });

                    const createdMessage = await Message.findByPk(message.id, {
                        include: [{ model: User, as: 'sender', attributes: ['id', 'displayName', 'photoURL'] }],
                        transaction,
                    });

                    return formatMessageForClient(createdMessage);
                });

                const room = `match:${matchId}`;
                io.to(room).emit('new:message', fullMessage);
            } catch (error) {
                console.error('Send message error:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // ── Typing indicator ──────────────────────────────
        socket.on('typing', (data) => {
            if (socket.currentRoom) {
                socket.to(socket.currentRoom).emit('typing', {
                    userId: socket.userId,
                    isTyping: data.isTyping,
                });
            }
        });

        // ── Get online users ──────────────────────────────
        socket.on('get:online-users', () => {
            const userIds = Array.from(onlineUsers.keys());
            socket.emit('online:users', { userIds });
        });

        // ── Presence: user:offline ────────────────────────
        socket.on('disconnect', () => {
            console.log(`🔌 Socket disconnected: ${socket.userId}`);

            const sockets = onlineUsers.get(socket.userId);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    onlineUsers.delete(socket.userId);
                    socket.broadcast.emit('user:offline', { userId: socket.userId });
                }
            }
        });
    });

    return io;
}

// ── Emit helpers (called from route handlers via req.app.get('io')) ──

/**
 * Emit swap:status-changed to the match room and user notification rooms.
 * @param {import('socket.io').Server} io
 * @param {Object} match - TrafficMatch instance
 * @param {string} newStatus - 'accepted' | 'rejected' | 'completed' | 'cancelled'
 * @param {string} [actorUserId] - User who triggered the change
 */
function emitSwapStatusChanged(io, match, newStatus, actorUserId) {
    if (!io) return;

    const payload = {
        matchId: match.id,
        status: newStatus,
        initiatorChannelId: match.initiatorChannelId,
        targetChannelId: match.targetChannelId,
        updatedAt: new Date().toISOString(),
        actorUserId,
    };

    // Emit to match room (if anyone is in the chat)
    io.to(`match:${match.id}`).emit('swap:status-changed', payload);
}

/**
 * Emit notification:new to a specific user's personal room.
 * @param {import('socket.io').Server} io
 * @param {string} targetUserId - User to notify
 * @param {Object} notification - { type, title, message, link, data }
 */
function emitNotification(io, targetUserId, notification) {
    if (!io) return;

    io.to(`user:${targetUserId}`).emit('notification:new', {
        ...notification,
        createdAt: new Date().toISOString(),
    });
}

/**
 * Emit support chat message to specific users.
 * @param {import('socket.io').Server} io
 * @param {string[]} targetUserIds
 * @param {Object} message
 */
function emitSupportMessage(io, targetUserIds, message) {
    if (!io || !Array.isArray(targetUserIds) || targetUserIds.length === 0 || !message) return;

    targetUserIds.forEach((userId) => {
        io.to(`support:${userId}`).emit('support:message', message);
    });
}

/**
 * Check if a user is currently online.
 * @param {string} userId
 * @returns {boolean}
 */
function isUserOnline(userId) {
    return onlineUsers.has(userId);
}

module.exports = setupSocket;
module.exports.emitSwapStatusChanged = emitSwapStatusChanged;
module.exports.emitNotification = emitNotification;
module.exports.emitSupportMessage = emitSupportMessage;
module.exports.isUserOnline = isUserOnline;

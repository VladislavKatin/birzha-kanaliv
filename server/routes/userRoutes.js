const router = require('express').Router();
const { User, YouTubeAccount, TrafficOffer, TrafficMatch, Review, Message, ChatRoom, ActionLog } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');

/**
 * Get user with all their YouTube channels.
 * @param {string} firebaseUid
 * @returns {Object|null} { user, channels }
 */
async function getUserWithChannels(firebaseUid) {
    const user = await User.findOne({ where: { firebaseUid } });
    if (!user) return null;
    const channels = await YouTubeAccount.findAll({ where: { userId: user.id } });
    return { user, channels };
}

/**
 * Compute trust level based on user activity metrics.
 * @param {Object} data - { totalChannels, verifiedChannels, completedExchanges, avgRating, reviewsGiven, accountCreatedAt }
 * @returns {Object} { level, color, points, progress, nextThreshold }
 */
function computeTrustLevel(data) {
    let points = 0;

    // Has connected channel (+10)
    if (data.totalChannels > 0) points += 10;
    // Has verified channel (+15)
    if (data.verifiedChannels > 0) points += 15;
    // Completed exchanges (+5 each, max 30)
    points += Math.min(data.completedExchanges * 5, 30);
    // Reviews given (+3 each, max 15)
    points += Math.min(data.reviewsGiven * 3, 15);
    // Average rating bonus
    if (data.avgRating >= 4.5) points += 20;
    else if (data.avgRating >= 4.0) points += 15;
    else if (data.avgRating >= 3.0) points += 10;
    // Account age bonus
    const daysSinceCreation = Math.floor((Date.now() - new Date(data.accountCreatedAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceCreation >= 90) points += 10;
    else if (daysSinceCreation >= 30) points += 5;

    points = Math.min(points, 100);

    let level, color;
    if (points >= 80) { level = 'Експерт'; color = '#22c55e'; }
    else if (points >= 50) { level = 'Перевірений'; color = '#3b82f6'; }
    else if (points >= 25) { level = 'Підтверджений'; color = '#f59e0b'; }
    else { level = 'Новачок'; color = '#a1a1b5'; }

    // Progress to next level
    let nextThreshold;
    if (points < 25) nextThreshold = 25;
    else if (points < 50) nextThreshold = 50;
    else if (points < 80) nextThreshold = 80;
    else nextThreshold = 100;

    const prevThreshold = points >= 80 ? 80 : points >= 50 ? 50 : points >= 25 ? 25 : 0;
    const progress = nextThreshold === prevThreshold ? 100 : Math.round(((points - prevThreshold) / (nextThreshold - prevThreshold)) * 100);

    return { level, color, points, progress, nextThreshold };
}

/**
 * @route GET /api/user/stats
 * @description Get dashboard stats: trust level, channel counts, swap counts, ratings
 * @access Private
 * @returns {Object} trustLevel, stats
 */
router.get('/stats', auth, async (req, res) => {
    try {
        const result = await getUserWithChannels(req.firebaseUser.uid);
        if (!result) return res.status(404).json({ error: 'User not found' });

        const { user, channels } = result;
        const channelIds = channels.map(c => c.id);

        // Channel stats
        const totalChannels = channels.length;
        const verifiedChannels = channels.filter(c => c.verified).length;

        // Active swaps (incoming + outgoing)
        let incomingSwaps = 0, outgoingSwaps = 0;
        if (channelIds.length > 0) {
            incomingSwaps = await TrafficMatch.count({
                where: { targetChannelId: { [Op.in]: channelIds }, status: 'pending' },
            });
            outgoingSwaps = await TrafficMatch.count({
                where: { initiatorChannelId: { [Op.in]: channelIds }, status: { [Op.in]: ['pending', 'accepted'] } },
            });
        }

        // Completed exchanges
        let completedExchanges = 0;
        if (channelIds.length > 0) {
            completedExchanges = await TrafficMatch.count({
                where: {
                    [Op.or]: [
                        { initiatorChannelId: { [Op.in]: channelIds } },
                        { targetChannelId: { [Op.in]: channelIds } },
                    ],
                    status: 'completed',
                },
            });
        }

        // Average rating
        let avgRating = 0, reviewCount = 0, reviewsGiven = 0;
        if (channelIds.length > 0) {
            const receivedReviews = await Review.findAll({
                where: { toChannelId: { [Op.in]: channelIds } },
                attributes: ['rating'],
            });
            reviewCount = receivedReviews.length;
            avgRating = reviewCount > 0
                ? Math.round((receivedReviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10
                : 0;

            reviewsGiven = await Review.count({
                where: { fromChannelId: { [Op.in]: channelIds } },
            });
        }

        // Trust level
        const trustLevel = computeTrustLevel({
            totalChannels,
            verifiedChannels,
            completedExchanges,
            avgRating,
            reviewsGiven,
            accountCreatedAt: user.createdAt,
        });

        res.json({
            trustLevel,
            stats: {
                totalChannels,
                verifiedChannels,
                incomingSwaps,
                outgoingSwaps,
                completedExchanges,
                avgRating,
                reviewCount,
            },
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({ error: 'Failed to get user stats' });
    }
});

/**
 * @route GET /api/user/activity
 * @description Get recent user activity feed (swaps, reviews, messages)
 * @access Private
 * @param {number} [limit=5] - Max events to return
 * @returns {Object} events[]
 */
router.get('/activity', auth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const result = await getUserWithChannels(req.firebaseUser.uid);
        if (!result) return res.status(404).json({ error: 'User not found' });

        const { user, channels } = result;
        const channelIds = channels.map(c => c.id);
        const events = [];

        if (channelIds.length > 0) {
            // Recent proposals (matches targeting user)
            const recentMatches = await TrafficMatch.findAll({
                where: {
                    [Op.or]: [
                        { targetChannelId: { [Op.in]: channelIds } },
                        { initiatorChannelId: { [Op.in]: channelIds } },
                    ],
                },
                include: [
                    { model: YouTubeAccount, as: 'initiatorChannel', attributes: ['channelTitle', 'channelAvatar'] },
                    { model: YouTubeAccount, as: 'targetChannel', attributes: ['channelTitle', 'channelAvatar'] },
                ],
                order: [['createdAt', 'DESC']],
                limit: 3,
            });

            for (const m of recentMatches) {
                const isIncoming = channelIds.includes(m.targetChannelId);
                events.push({
                    type: 'swap',
                    id: m.id,
                    title: isIncoming
                        ? `Нова пропозиція від ${m.initiatorChannel?.channelTitle || 'Канал'}`
                        : 'Ви відгукнулися на пропозицію',
                    status: m.status,
                    date: m.createdAt,
                    avatar: isIncoming ? m.initiatorChannel?.channelAvatar : m.targetChannel?.channelAvatar,
                    link: isIncoming ? '/swaps/incoming' : '/swaps/outgoing',
                });
            }

            // Recent reviews received
            const recentReviews = await Review.findAll({
                where: { toChannelId: { [Op.in]: channelIds } },
                include: [
                    { model: YouTubeAccount, as: 'fromChannel', attributes: ['channelTitle', 'channelAvatar'] },
                ],
                order: [['createdAt', 'DESC']],
                limit: 3,
            });

            for (const r of recentReviews) {
                events.push({
                    type: 'review',
                    id: r.id,
                    title: `Відгук від ${r.fromChannel?.channelTitle || 'Канал'}: ${'★'.repeat(r.rating)}`,
                    date: r.createdAt,
                    avatar: r.fromChannel?.channelAvatar,
                    link: '/exchanges',
                });
            }
        }

        // Recent messages
        const recentMessages = await Message.findAll({
            where: { senderUserId: { [Op.ne]: user.id } },
            include: [
                { model: User, as: 'sender', attributes: ['displayName', 'photoURL'] },
                { model: ChatRoom, as: 'chatRoom', attributes: ['matchId'] },
            ],
            order: [['createdAt', 'DESC']],
            limit: 3,
        });

        for (const msg of recentMessages) {
            // Only include if user is part of the match
            if (msg.chatRoom) {
                const match = await TrafficMatch.findByPk(msg.chatRoom.matchId);
                if (match && channelIds.some(cid =>
                    cid === match.initiatorChannelId || cid === match.targetChannelId
                )) {
                    events.push({
                        type: 'message',
                        id: msg.id,
                        title: `Повідомлення від ${msg.sender?.displayName || 'Користувач'}`,
                        preview: msg.content.substring(0, 60),
                        date: msg.createdAt,
                        avatar: msg.sender?.photoURL,
                        link: `/support/chats?thread=match-${msg.chatRoom.matchId}`,
                    });
                }
            }
        }

        // Sort by date and limit
        events.sort((a, b) => new Date(b.date) - new Date(a.date));
        res.json({ events: events.slice(0, limit) });
    } catch (error) {
        console.error('Get user activity error:', error);
        res.status(500).json({ error: 'Failed to get activity' });
    }
});

/**
 * @route GET /api/user/influence-history
 * @description Get 30-day influence score history based on completed exchanges
 * @access Private
 * @returns {Object} history[] - { date, score }
 */
router.get('/influence-history', auth, async (req, res) => {
    try {
        const result = await getUserWithChannels(req.firebaseUser.uid);
        if (!result) return res.status(404).json({ error: 'User not found' });

        const { channels } = result;
        const channelIds = channels.map(c => c.id);

        // Build 30-day history based on completed matches dates
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
        const history = [];

        // Base score from channels
        let baseScore = channels.length > 0 ? 30 : 10;
        if (channels.some(c => c.verified)) baseScore += 15;

        // Get completed matches in last 30 days
        let matches = [];
        if (channelIds.length > 0) {
            matches = await TrafficMatch.findAll({
                where: {
                    [Op.or]: [
                        { initiatorChannelId: { [Op.in]: channelIds } },
                        { targetChannelId: { [Op.in]: channelIds } },
                    ],
                    status: 'completed',
                    updatedAt: { [Op.gte]: thirtyDaysAgo },
                },
                order: [['updatedAt', 'ASC']],
            });
        }

        // Generate daily data points
        let cumulativeBonus = 0;
        for (let i = 29; i >= 0; i--) {
            const d = new Date(Date.now() - i * 24 * 3600 * 1000);
            const dayStr = d.toISOString().split('T')[0];

            // Count matches completed on this day
            const dayMatches = matches.filter(m => {
                const mDay = new Date(m.updatedAt).toISOString().split('T')[0];
                return mDay <= dayStr;
            }).length;
            cumulativeBonus = dayMatches * 5;

            history.push({
                date: dayStr,
                score: Math.min(baseScore + cumulativeBonus, 100),
            });
        }

        res.json({ history });
    } catch (error) {
        console.error('Influence history error:', error);
        res.status(500).json({ error: 'Failed to get influence history' });
    }
});

/**
 * @route GET /api/user/recommendations
 * @description Get partner recommendations based on niche/language similarity
 * @access Private
 * @returns {Object} recommendations[] - Similar channels sorted by subscribers
 */
router.get('/recommendations', auth, async (req, res) => {
    try {
        const result = await getUserWithChannels(req.firebaseUser.uid);
        if (!result) return res.status(404).json({ error: 'User not found' });

        const { user, channels } = result;
        const channelIds = channels.map(c => c.id);

        // Find channels similar by niche/language, excluding own
        const niches = channels.map(c => c.niche).filter(Boolean);
        const languages = channels.map(c => c.language).filter(Boolean);

        const whereClause = {
            userId: { [Op.ne]: user.id },
            isActive: true,
        };

        if (niches.length > 0 || languages.length > 0) {
            whereClause[Op.or] = [];
            if (niches.length > 0) whereClause[Op.or].push({ niche: { [Op.in]: niches } });
            if (languages.length > 0) whereClause[Op.or].push({ language: { [Op.in]: languages } });
        }

        const recommendations = await YouTubeAccount.findAll({
            where: whereClause,
            include: [{ model: User, as: 'owner', attributes: ['id', 'displayName', 'photoURL'] }],
            attributes: ['id', 'channelId', 'channelTitle', 'channelAvatar', 'subscribers', 'totalViews', 'niche', 'language', 'verified'],
            order: [['subscribers', 'DESC']],
            limit: 5,
        });

        res.json({ recommendations });
    } catch (error) {
        console.error('Recommendations error:', error);
        res.status(500).json({ error: 'Failed to get recommendations' });
    }
});

/**
 * @route GET /api/user/menu-badges
 * @description Aggregated payload for dashboard menu badges to avoid multiple concurrent requests
 * @access Private
 * @returns {Object} incoming, outgoing, messageThreads, myUserId
 */
router.get('/menu-badges', auth, async (req, res) => {
    try {
        const result = await getUserWithChannels(req.firebaseUser.uid);
        if (!result) return res.status(404).json({ error: 'User not found' });

        const { user, channels } = result;
        const channelIds = channels.map((channel) => channel.id);

        let incoming = 0;
        let outgoing = 0;
        let matchThreads = [];

        if (channelIds.length > 0) {
            const [incomingCount, outgoingCount, matches] = await Promise.all([
                TrafficMatch.count({
                    where: {
                        targetChannelId: { [Op.in]: channelIds },
                        status: 'pending',
                    },
                }),
                TrafficMatch.count({
                    where: {
                        initiatorChannelId: { [Op.in]: channelIds },
                        status: 'pending',
                    },
                }),
                TrafficMatch.findAll({
                    where: {
                        [Op.or]: [
                            { initiatorChannelId: { [Op.in]: channelIds } },
                            { targetChannelId: { [Op.in]: channelIds } },
                        ],
                        status: { [Op.in]: ['pending', 'accepted', 'completed'] },
                    },
                    include: [
                        {
                            model: ChatRoom,
                            as: 'chatRoom',
                            attributes: ['id'],
                            required: false,
                        },
                    ],
                    attributes: ['id', 'initiatorChannelId', 'targetChannelId', 'updatedAt'],
                    order: [['updatedAt', 'DESC']],
                    limit: 100,
                }),
            ]);

            incoming = incomingCount;
            outgoing = outgoingCount;

            const roomIds = matches
                .map((match) => match.chatRoom?.id || null)
                .filter(Boolean);
            const uniqueRoomIds = Array.from(new Set(roomIds));

            const lastMessagesByRoom = new Map();
            if (uniqueRoomIds.length > 0) {
                const messages = await Message.findAll({
                    where: { chatRoomId: { [Op.in]: uniqueRoomIds } },
                    include: [{ model: User, as: 'sender', attributes: ['id'] }],
                    attributes: ['id', 'chatRoomId', 'createdAt'],
                    order: [['createdAt', 'DESC']],
                });

                messages.forEach((message) => {
                    if (!lastMessagesByRoom.has(message.chatRoomId)) {
                        lastMessagesByRoom.set(message.chatRoomId, {
                            id: message.id,
                            createdAt: message.createdAt,
                            sender: {
                                id: message.sender?.id || null,
                            },
                        });
                    }
                });
            }

            matchThreads = matches.map((match) => {
                const threadId = `match-${match.id}`;
                const chatRoomId = match.chatRoom?.id || null;
                const lastMessage = chatRoomId ? (lastMessagesByRoom.get(chatRoomId) || null) : null;
                return {
                    id: threadId,
                    lastMessage,
                    lastMessageAt: lastMessage?.createdAt || match.updatedAt,
                };
            });
        }

        const adminUsers = await User.findAll({
            where: { role: 'admin' },
            attributes: ['id'],
        });
        const adminIds = adminUsers.map((admin) => admin.id);

        const supportLogs = await ActionLog.findAll({
            where: {
                action: 'support_chat_message',
                userId: {
                    [Op.in]: Array.from(new Set([user.id, ...adminIds])),
                },
            },
            include: [{ model: User, as: 'user', attributes: ['id', 'role'] }],
            order: [['createdAt', 'DESC']],
            limit: 100,
        });

        const visibleSupportLog = supportLogs.find((log) => {
            if (user.role === 'admin') return true;
            if (log.userId === user.id) return true;

            const senderIsAdmin = log.user?.role === 'admin';
            if (!senderIsAdmin) return false;

            const targetUserId = log.details?.targetUserId || null;
            return !targetUserId || targetUserId === user.id;
        }) || null;

        const supportThread = visibleSupportLog
            ? {
                id: 'support',
                lastMessage: {
                    id: visibleSupportLog.id,
                    createdAt: visibleSupportLog.createdAt,
                    sender: {
                        id: visibleSupportLog.user?.id || null,
                    },
                },
                lastMessageAt: visibleSupportLog.createdAt,
            }
            : null;

        const messageThreads = supportThread
            ? [supportThread, ...matchThreads]
            : matchThreads;

        res.json({
            incoming,
            outgoing,
            messageThreads,
            myUserId: user.id,
        });
    } catch (error) {
        console.error('Get menu badges error:', error);
        res.status(500).json({ error: 'Failed to get menu badges' });
    }
});

module.exports = router;

const { User, YouTubeAccount, TrafficOffer, TrafficMatch, Review, Message, ActionLog, ChatRoom } = require('../../models');

/**
 * Export all user data as a JSON object (GDPR).
 * Can be run synchronously or as a Bull queue task.
 *
 * @async
 * @param {string} userId - User ID to export data for
 * @returns {Object} Complete user data export
 */
async function exportData(userId) {
    const user = await User.findByPk(userId, {
        attributes: { exclude: ['firebaseUid'] },
    });

    if (!user) throw new Error('User not found');

    const channels = await YouTubeAccount.findAll({ where: { userId } });
    const channelIds = channels.map(c => c.id);

    const [offers, reviews, actionLogs] = await Promise.all([
        TrafficOffer.findAll({ where: { channelId: channelIds } }),
        Review.findAll({ where: { fromChannelId: channelIds } }),
        ActionLog.findAll({ where: { userId } }),
    ]);

    const matches = await TrafficMatch.findAll({
        where: {
            [require('sequelize').Op.or]: [
                { initiatorChannelId: channelIds },
                { targetChannelId: channelIds },
            ],
        },
    });

    const chatRoomIds = (await ChatRoom.findAll({
        where: { matchId: matches.map(m => m.id) },
        attributes: ['id'],
    })).map(cr => cr.id);

    const messages = chatRoomIds.length > 0
        ? await Message.findAll({ where: { chatRoomId: chatRoomIds } })
        : [];

    return {
        exportedAt: new Date().toISOString(),
        user: user.toJSON(),
        channels: channels.map(c => c.toJSON()),
        offers: offers.map(o => o.toJSON()),
        matches: matches.map(m => m.toJSON()),
        reviews: reviews.map(r => r.toJSON()),
        messages: messages.map(m => m.toJSON()),
        actionLogs: actionLogs.map(a => a.toJSON()),
    };
}

module.exports = { exportData };

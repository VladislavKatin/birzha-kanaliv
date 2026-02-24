const { Op } = require('sequelize');
const {
    sequelize,
    User,
    YouTubeAccount,
    TrafficOffer,
    TrafficMatch,
    Review,
    ChatRoom,
    Message,
    ActionLog,
} = require('../models');

const ADMIN_EMAIL = 'vladkatintam@gmail.com';
const PROTECTED_EMAILS = new Set([ADMIN_EMAIL]);

function unique(values) {
    return Array.from(new Set((values || []).filter(Boolean)));
}

async function main() {
    const result = await sequelize.transaction(async (transaction) => {
        const adminUser = await User.findOne({
            where: {
                [Op.or]: [
                    { email: ADMIN_EMAIL },
                    { role: 'admin' },
                ],
            },
            order: [['createdAt', 'ASC']],
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (!adminUser) {
            throw new Error('Admin user not found. Cleanup requires an actor for audit logging.');
        }

        const botUsers = await User.findAll({
            attributes: ['id', 'email', 'firebaseUid', 'role'],
            where: {
                [Op.and]: [
                    {
                        [Op.or]: [
                            { email: { [Op.iLike]: '%@example.com' } },
                            { email: { [Op.iLike]: '%@example.test' } },
                            { firebaseUid: { [Op.iLike]: 'seed-firebase-%' } },
                        ],
                    },
                    { email: { [Op.notIn]: Array.from(PROTECTED_EMAILS) } },
                ],
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        const botUserIdsFromUsers = botUsers.map((user) => user.id);

        const botChannels = await YouTubeAccount.findAll({
            attributes: ['id', 'userId', 'channelId'],
            where: {
                [Op.or]: [
                    { channelId: { [Op.iLike]: 'UC_DEMO_%' } },
                    { userId: { [Op.in]: botUserIdsFromUsers.length ? botUserIdsFromUsers : ['00000000-0000-0000-0000-000000000000'] } },
                ],
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        const botChannelIds = unique(botChannels.map((row) => row.id));
        const botUserIdsFromChannels = unique(botChannels.map((row) => row.userId));
        const botUserIds = unique([...botUserIdsFromUsers, ...botUserIdsFromChannels]);

        if (botUserIds.length === 0 && botChannelIds.length === 0) {
            await ActionLog.create({
                userId: adminUser.id,
                action: 'admin_purge_bot_users',
                details: {
                    deleted: false,
                    reason: 'no_bot_entities_found',
                },
                ip: 'system-script',
            }, { transaction });

            return {
                deletedUsers: 0,
                deletedChannels: 0,
                deletedOffers: 0,
                deletedMatches: 0,
                deletedReviews: 0,
                deletedChatRooms: 0,
                deletedMessages: 0,
                deletedActionLogs: 0,
            };
        }

        const botOfferRows = await TrafficOffer.findAll({
            attributes: ['id'],
            where: {
                channelId: { [Op.in]: botChannelIds.length ? botChannelIds : ['00000000-0000-0000-0000-000000000000'] },
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        const botOfferIds = unique(botOfferRows.map((row) => row.id));

        const botMatchRows = await TrafficMatch.findAll({
            attributes: ['id'],
            where: {
                [Op.or]: [
                    { offerId: { [Op.in]: botOfferIds.length ? botOfferIds : ['00000000-0000-0000-0000-000000000000'] } },
                    { initiatorChannelId: { [Op.in]: botChannelIds.length ? botChannelIds : ['00000000-0000-0000-0000-000000000000'] } },
                    { targetChannelId: { [Op.in]: botChannelIds.length ? botChannelIds : ['00000000-0000-0000-0000-000000000000'] } },
                ],
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        const botMatchIds = unique(botMatchRows.map((row) => row.id));

        const botChatRoomRows = await ChatRoom.findAll({
            attributes: ['id'],
            where: {
                matchId: { [Op.in]: botMatchIds.length ? botMatchIds : ['00000000-0000-0000-0000-000000000000'] },
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        const botChatRoomIds = unique(botChatRoomRows.map((row) => row.id));

        const deletedMessages = await Message.destroy({
            where: {
                chatRoomId: { [Op.in]: botChatRoomIds.length ? botChatRoomIds : ['00000000-0000-0000-0000-000000000000'] },
            },
            transaction,
        });

        const deletedReviews = await Review.destroy({
            where: {
                [Op.or]: [
                    { matchId: { [Op.in]: botMatchIds.length ? botMatchIds : ['00000000-0000-0000-0000-000000000000'] } },
                    { fromChannelId: { [Op.in]: botChannelIds.length ? botChannelIds : ['00000000-0000-0000-0000-000000000000'] } },
                    { toChannelId: { [Op.in]: botChannelIds.length ? botChannelIds : ['00000000-0000-0000-0000-000000000000'] } },
                ],
            },
            transaction,
        });

        const deletedChatRooms = await ChatRoom.destroy({
            where: {
                id: { [Op.in]: botChatRoomIds.length ? botChatRoomIds : ['00000000-0000-0000-0000-000000000000'] },
            },
            transaction,
        });

        const deletedMatches = await TrafficMatch.destroy({
            where: {
                id: { [Op.in]: botMatchIds.length ? botMatchIds : ['00000000-0000-0000-0000-000000000000'] },
            },
            transaction,
        });

        const deletedOffers = await TrafficOffer.destroy({
            where: {
                channelId: { [Op.in]: botChannelIds.length ? botChannelIds : ['00000000-0000-0000-0000-000000000000'] },
            },
            transaction,
        });

        const deletedChannels = await YouTubeAccount.destroy({
            where: {
                id: { [Op.in]: botChannelIds.length ? botChannelIds : ['00000000-0000-0000-0000-000000000000'] },
            },
            transaction,
        });

        const deletedActionLogs = await ActionLog.destroy({
            where: {
                userId: { [Op.in]: botUserIds.length ? botUserIds : ['00000000-0000-0000-0000-000000000000'] },
            },
            transaction,
        });

        const deletedUsers = await User.destroy({
            where: {
                id: { [Op.in]: botUserIds.length ? botUserIds : ['00000000-0000-0000-0000-000000000000'] },
                email: { [Op.notIn]: Array.from(PROTECTED_EMAILS) },
            },
            transaction,
        });

        await ActionLog.create({
            userId: adminUser.id,
            action: 'admin_purge_bot_users',
            details: {
                deleted: true,
                botUserIds,
                botChannelIds,
                deletedUsers,
                deletedChannels,
                deletedOffers,
                deletedMatches,
                deletedReviews,
                deletedChatRooms,
                deletedMessages,
                deletedActionLogs,
            },
            ip: 'system-script',
        }, { transaction });

        return {
            deletedUsers,
            deletedChannels,
            deletedOffers,
            deletedMatches,
            deletedReviews,
            deletedChatRooms,
            deletedMessages,
            deletedActionLogs,
        };
    });

    console.log('Bot cleanup completed:', result);
}

main()
    .then(async () => {
        await sequelize.close();
        process.exit(0);
    })
    .catch(async (error) => {
        console.error('Bot cleanup failed:', error);
        await sequelize.close();
        process.exit(1);
    });

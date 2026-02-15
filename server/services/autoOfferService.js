const { Op } = require('sequelize');

function buildAutoOfferDescription(channelTitle) {
    return `Автоматична пропозиція каналу ${channelTitle || 'без назви'}.`;
}

async function ensureAutoOffersForChannels({
    sequelize,
    YouTubeAccount,
    TrafficOffer,
    ActionLog,
    channelIds = null,
    reason = 'auto_offer_sync',
    transaction: externalTransaction = null,
}) {
    const run = async (transaction) => {
        const where = {
            isActive: true,
            isFlagged: false,
            channelId: { [Op.notLike]: 'UC_DEMO_%' },
        };

        if (Array.isArray(channelIds) && channelIds.length > 0) {
            where.id = { [Op.in]: channelIds };
        }

        const channels = await YouTubeAccount.findAll({
            where,
            attributes: ['id', 'userId', 'channelTitle', 'niche', 'language', 'subscribers'],
            transaction,
        });

        if (channels.length === 0) {
            return { created: 0 };
        }

        const existingOffers = await TrafficOffer.findAll({
            where: { channelId: { [Op.in]: channels.map((channel) => channel.id) } },
            attributes: ['id', 'channelId'],
            raw: true,
            transaction,
        });

        const existingChannelIds = new Set(existingOffers.map((offer) => offer.channelId));
        let created = 0;

        for (const channel of channels) {
            if (existingChannelIds.has(channel.id)) {
                continue;
            }

            const offer = await TrafficOffer.create({
                channelId: channel.id,
                type: 'subs',
                description: buildAutoOfferDescription(channel.channelTitle),
                niche: channel.niche || null,
                language: channel.language || null,
                minSubscribers: 0,
                maxSubscribers: Number(channel.subscribers || 0) > 0 ? Number(channel.subscribers) * 10 : 0,
                status: 'open',
            }, { transaction });

            await ActionLog.create({
                userId: channel.userId,
                action: 'auto_offer_created',
                details: {
                    offerId: offer.id,
                    channelId: channel.id,
                    reason,
                },
                ip: '127.0.0.1',
            }, { transaction });

            created += 1;
        }

        return { created };
    };

    if (externalTransaction) {
        return run(externalTransaction);
    }

    return sequelize.transaction(run);
}

module.exports = {
    ensureAutoOffersForChannels,
};

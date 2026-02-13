async function getUserChannelsByFirebaseUid({ User, YouTubeAccount, firebaseUid }) {
    const user = await User.findOne({ where: { firebaseUid } });
    if (!user) return null;

    const channels = await YouTubeAccount.findAll({ where: { userId: user.id } });
    const channelIds = channels.map((channel) => channel.id);

    return { user, channels, channelIds };
}

function resolveActionChannelId({ requestedChannelId, channelIds }) {
    if (!Array.isArray(channelIds) || channelIds.length === 0) {
        return { channelId: null, error: 'NO_CHANNELS_CONNECTED' };
    }

    if (requestedChannelId) {
        if (!channelIds.includes(requestedChannelId)) {
            return { channelId: null, error: 'CHANNEL_NOT_OWNED' };
        }
        return { channelId: requestedChannelId, error: null };
    }

    if (channelIds.length === 1) {
        return { channelId: channelIds[0], error: null };
    }

    return { channelId: null, error: 'CHANNEL_ID_REQUIRED' };
}

module.exports = {
    getUserChannelsByFirebaseUid,
    resolveActionChannelId,
};

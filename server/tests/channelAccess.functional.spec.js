const assert = require('node:assert/strict');
const { getUserChannelsByFirebaseUid } = require('../services/channelAccessService');

async function runChannelAccessFunctionalTests() {
    const User = {
        async findOne({ where }) {
            if (where.firebaseUid === 'missing') {
                return null;
            }
            return { id: 'user-1' };
        },
    };

    const YouTubeAccount = {
        async findAll({ where }) {
            assert.equal(where.userId, 'user-1');
            return [{ id: 'ch-1' }, { id: 'ch-2' }];
        },
    };

    const found = await getUserChannelsByFirebaseUid({
        User,
        YouTubeAccount,
        firebaseUid: 'uid-1',
    });

    assert.equal(found.user.id, 'user-1');
    assert.deepEqual(found.channelIds, ['ch-1', 'ch-2']);

    const missing = await getUserChannelsByFirebaseUid({
        User,
        YouTubeAccount,
        firebaseUid: 'missing',
    });

    assert.equal(missing, null);
}

module.exports = {
    runChannelAccessFunctionalTests,
};

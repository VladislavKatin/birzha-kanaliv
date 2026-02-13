const assert = require('node:assert/strict');
const { resolveActionChannelId } = require('../services/channelAccessService');

function runChannelAccessUnitTests() {
    assert.deepEqual(
        resolveActionChannelId({ requestedChannelId: null, channelIds: [] }),
        { channelId: null, error: 'NO_CHANNELS_CONNECTED' }
    );

    assert.deepEqual(
        resolveActionChannelId({ requestedChannelId: null, channelIds: ['ch-1'] }),
        { channelId: 'ch-1', error: null }
    );

    assert.deepEqual(
        resolveActionChannelId({ requestedChannelId: null, channelIds: ['ch-1', 'ch-2'] }),
        { channelId: null, error: 'CHANNEL_ID_REQUIRED' }
    );

    assert.deepEqual(
        resolveActionChannelId({ requestedChannelId: 'ch-2', channelIds: ['ch-1', 'ch-2'] }),
        { channelId: 'ch-2', error: null }
    );

    assert.deepEqual(
        resolveActionChannelId({ requestedChannelId: 'ch-3', channelIds: ['ch-1', 'ch-2'] }),
        { channelId: null, error: 'CHANNEL_NOT_OWNED' }
    );
}

module.exports = {
    runChannelAccessUnitTests,
};

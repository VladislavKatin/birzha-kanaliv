const assert = require('node:assert/strict');
const {
    normalizeIncomingMessagePayload,
    parseStoredMessageContent,
} = require('../services/chatMessagePayload');

function runChatMessagePayloadUnitTests() {
    const textOnly = normalizeIncomingMessagePayload({ content: ' hello ' });
    assert.equal(textOnly.text, 'hello');
    assert.equal(textOnly.imageData, null);

    const imageOnly = normalizeIncomingMessagePayload({
        imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6Xn4sAAAAASUVORK5CYII=',
    });
    assert.equal(imageOnly.text, '');
    assert.equal(typeof imageOnly.imageData, 'string');

    const parsed = parseStoredMessageContent(imageOnly.storedContent);
    assert.equal(parsed.text, '');
    assert.equal(parsed.imageData?.startsWith('data:image/'), true);

    assert.throws(() => normalizeIncomingMessagePayload({ content: ' ' }), /text or image/i);
    assert.throws(() => normalizeIncomingMessagePayload({ imageData: 'bad-data' }), /valid base64 data URL/i);
}

module.exports = {
    runChatMessagePayloadUnitTests,
};

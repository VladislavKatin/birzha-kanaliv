const assert = require('node:assert/strict');
const { createTelegramLinkToken, verifyTelegramLinkToken } = require('../services/telegramLinkToken');

function runTelegramTokenUnitTests() {
    const token = createTelegramLinkToken('11111111-1111-4111-8111-111111111111', 60);
    assert.equal(token.length <= 64, true);
    assert.equal(/^[A-Za-z0-9_-]+$/.test(token), true);

    const verified = verifyTelegramLinkToken(token);
    assert.equal(verified.valid, true);
    assert.equal(verified.userId, '11111111-1111-4111-8111-111111111111');

    const tampered = `${token}x`;
    const invalid = verifyTelegramLinkToken(tampered);
    assert.equal(invalid.valid, false);

    const expiredToken = createTelegramLinkToken('11111111-1111-4111-8111-111111111111', -1);
    const expired = verifyTelegramLinkToken(expiredToken);
    assert.equal(expired.valid, false);
    assert.equal(expired.reason, 'expired');
}

module.exports = {
    runTelegramTokenUnitTests,
};

const assert = require('node:assert/strict');
const { determineConfirmationPatch } = require('../services/chatCompletionService');

function runChatCompletionUnitTests() {
    assert.deepEqual(determineConfirmationPatch(true), { initiatorConfirmed: true });
    assert.deepEqual(determineConfirmationPatch(false), { targetConfirmed: true });
}

module.exports = {
    runChatCompletionUnitTests,
};

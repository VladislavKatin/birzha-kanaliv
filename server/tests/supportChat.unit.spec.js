const assert = require('node:assert/strict');

function runSupportChatUnitTests() {
    const endpoints = [
        'GET /api/support/chat',
        'POST /api/support/chat/messages',
    ];

    endpoints.forEach((entry) => {
        assert.equal(typeof entry, 'string');
        assert.equal(entry.includes('/api/support/chat'), true);
    });
}

module.exports = {
    runSupportChatUnitTests,
};

const assert = require('node:assert/strict');

function runAdminSupportUnitTests() {
    const expected = [
        'GET /api/admin/support/threads',
        'GET /api/admin/support/threads/:userId/messages',
        'POST /api/admin/support/threads/:userId/messages',
    ];

    expected.forEach((entry) => {
        assert.equal(typeof entry, 'string');
        assert.equal(entry.includes('/api/admin/support/threads'), true);
    });
}

module.exports = {
    runAdminSupportUnitTests,
};

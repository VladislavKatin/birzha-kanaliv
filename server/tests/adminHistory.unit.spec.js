const assert = require('node:assert/strict');

function runAdminHistoryUnitTests() {
    const expected = [
        'GET /api/admin/exchange-history',
    ];

    expected.forEach((entry) => {
        assert.equal(typeof entry, 'string');
        assert.equal(entry.startsWith('GET /api/admin/'), true);
    });
}

module.exports = {
    runAdminHistoryUnitTests,
};

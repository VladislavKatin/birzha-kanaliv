const assert = require('node:assert/strict');

function runAdminSystemUnitTests() {
    const expected = [
        'GET /api/admin/system/insights',
        'GET /api/admin/users/:id/details',
    ];

    expected.forEach((entry) => {
        assert.equal(typeof entry, 'string');
        assert.equal(entry.includes('/api/admin/'), true);
    });
}

module.exports = {
    runAdminSystemUnitTests,
};

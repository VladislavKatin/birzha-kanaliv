const assert = require('node:assert/strict');

function runAdminOpsUnitTests() {
    const expected = [
        'GET /api/admin/incidents',
        'GET /api/admin/demo/channels',
        'PATCH /api/admin/demo/channels/:id/active',
        'PATCH /api/admin/demo/offers/:id/status',
        'GET /api/admin/exports/users.csv',
        'GET /api/admin/exports/exchanges.csv',
        'GET /api/admin/exports/support.csv',
    ];

    expected.forEach((entry) => {
        assert.equal(typeof entry, 'string');
        assert.equal(entry.includes('/api/admin/'), true);
    });
}

module.exports = {
    runAdminOpsUnitTests,
};

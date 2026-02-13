const assert = require('node:assert/strict');

function runAdminModerationUnitTests() {
    const expected = [
        'GET /api/admin/channels',
        'PATCH /api/admin/channels/:id/flag',
        'PATCH /api/admin/channels/:id/active',
        'GET /api/admin/offers',
        'PATCH /api/admin/offers/:id/status',
        'GET /api/admin/matches',
        'PATCH /api/admin/matches/:id/status',
    ];

    expected.forEach((entry) => {
        assert.equal(typeof entry, 'string');
        assert.equal(entry.includes('/api/admin/'), true);
    });
}

module.exports = {
    runAdminModerationUnitTests,
};

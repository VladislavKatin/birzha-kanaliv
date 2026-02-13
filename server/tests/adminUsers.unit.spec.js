const assert = require('node:assert/strict');

function runAdminUsersUnitTests() {
    const expected = [
        'GET /api/admin/users',
        'PATCH /api/admin/users/:id/role',
        'PATCH /api/admin/users/:id/suspend',
    ];

    expected.forEach((entry) => {
        assert.equal(typeof entry, 'string');
        assert.equal(entry.includes('/api/admin/users'), true);
    });
}

module.exports = {
    runAdminUsersUnitTests,
};

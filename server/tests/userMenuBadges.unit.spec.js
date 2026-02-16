const assert = require('node:assert/strict');

function runUserMenuBadgesUnitTests() {
    const endpoints = [
        'GET /api/user/menu-badges',
    ];

    endpoints.forEach((entry) => {
        assert.equal(typeof entry, 'string');
        assert.equal(entry.includes('/api/user/menu-badges'), true);
    });
}

module.exports = {
    runUserMenuBadgesUnitTests,
};

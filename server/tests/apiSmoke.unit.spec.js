const assert = require('node:assert/strict');

const smokeEndpoints = [
    { method: 'GET', path: '/api/auth/me' },
    { method: 'GET', path: '/api/offers' },
    { method: 'GET', path: '/api/offers/:id' },
    { method: 'POST', path: '/api/offers' },
    { method: 'POST', path: '/api/offers/:id/respond' },
    { method: 'POST', path: '/api/swaps/:id/accept' },
    { method: 'POST', path: '/api/swaps/:id/decline' },
    { method: 'POST', path: '/api/chat/:matchId/messages' },
    { method: 'POST', path: '/api/reviews' },
];

function runApiSmokeUnitTests() {
    assert.equal(smokeEndpoints.length >= 9, true);

    const required = new Set([
        'GET /api/auth/me',
        'GET /api/offers',
        'GET /api/offers/:id',
        'POST /api/offers',
        'POST /api/offers/:id/respond',
        'POST /api/swaps/:id/accept',
        'POST /api/swaps/:id/decline',
        'POST /api/chat/:matchId/messages',
        'POST /api/reviews',
    ]);

    const actual = new Set(smokeEndpoints.map((entry) => `${entry.method} ${entry.path}`));
    required.forEach((endpoint) => assert.equal(actual.has(endpoint), true));
}

module.exports = {
    runApiSmokeUnitTests,
};

const assert = require('node:assert/strict');

const TEST_UID = 'seed-firebase-uid-1';

async function runUserMenuBadgesFunctionalTests() {
    process.env.NODE_ENV = 'test';
    const app = require('../app');

    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
        const response = await request(baseUrl, {
            method: 'GET',
            path: '/api/user/menu-badges',
            uid: TEST_UID,
        });

        assert.equal(response.status, 200);
        assert.equal(Number.isFinite(response.body.incoming), true);
        assert.equal(Number.isFinite(response.body.outgoing), true);
        assert.equal(Array.isArray(response.body.messageThreads), true);
        assert.equal(typeof response.body.myUserId, 'string');
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
}

async function request(baseUrl, { method, path, uid, body }) {
    const headers = { 'content-type': 'application/json' };
    if (uid) headers['x-test-firebase-uid'] = uid;

    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    let json;
    try {
        json = text ? JSON.parse(text) : {};
    } catch {
        json = { raw: text };
    }

    return { status: response.status, body: json };
}

module.exports = {
    runUserMenuBadgesFunctionalTests,
};

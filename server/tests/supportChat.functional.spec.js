const assert = require('node:assert/strict');

const TEST_UID = 'seed-firebase-uid-1';

async function runSupportChatFunctionalTests() {
    process.env.NODE_ENV = 'test';
    const app = require('../app');

    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
        const load = await request(baseUrl, {
            method: 'GET',
            path: '/api/support/chat',
            uid: TEST_UID,
        });

        assert.equal(load.status, 200);
        assert.equal(Array.isArray(load.body.messages), true);
        assert.equal(!!load.body.adminWelcome, true);

        const send = await request(baseUrl, {
            method: 'POST',
            path: '/api/support/chat/messages',
            uid: TEST_UID,
            body: {
                content: 'support smoke message',
                imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6Xn4sAAAAASUVORK5CYII=',
            },
        });

        assert.equal(send.status, 201);
        assert.equal(send.body.message.content, 'support smoke message');
        assert.equal(typeof send.body.message.imageData, 'string');
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
    runSupportChatFunctionalTests,
};

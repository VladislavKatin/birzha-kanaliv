const assert = require('node:assert/strict');

const ADMIN_UID = 'seed-firebase-uid-1';
const USER_UID = 'seed-firebase-uid-2';

async function runAdminSupportFunctionalTests() {
    process.env.NODE_ENV = 'test';
    const app = require('../app');
    const { User } = require('../models');

    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
        const adminUser = await User.findOne({ where: { firebaseUid: ADMIN_UID } });
        const user = await User.findOne({ where: { firebaseUid: USER_UID } });

        assert.equal(!!adminUser, true);
        assert.equal(!!user, true);

        const prevAdminRole = adminUser.role;
        await adminUser.update({ role: 'admin' });

        const userMessageText = `user support message ${Date.now()}`;
        const adminReplyText = `admin support reply ${Date.now()}`;

        try {
            const userSend = await request(baseUrl, {
                method: 'POST',
                path: '/api/support/chat/messages',
                uid: USER_UID,
                body: { content: userMessageText },
            });
            assert.equal(userSend.status, 201);

            const threadList = await request(baseUrl, {
                method: 'GET',
                path: '/api/admin/support/threads',
                uid: ADMIN_UID,
            });
            assert.equal(threadList.status, 200);
            assert.equal(Array.isArray(threadList.body.threads), true);
            assert.equal(threadList.body.threads.some((row) => row.user?.id === user.id), true);

            const threadMessages = await request(baseUrl, {
                method: 'GET',
                path: `/api/admin/support/threads/${user.id}/messages`,
                uid: ADMIN_UID,
            });
            assert.equal(threadMessages.status, 200);
            assert.equal(Array.isArray(threadMessages.body.messages), true);
            assert.equal(threadMessages.body.messages.some((msg) => msg.content === userMessageText), true);

            const reply = await request(baseUrl, {
                method: 'POST',
                path: `/api/admin/support/threads/${user.id}/messages`,
                uid: ADMIN_UID,
                body: { content: adminReplyText },
            });
            assert.equal(reply.status, 201);
            assert.equal(reply.body.message.content, adminReplyText);

            const userChat = await request(baseUrl, {
                method: 'GET',
                path: '/api/support/chat',
                uid: USER_UID,
            });
            assert.equal(userChat.status, 200);
            assert.equal(Array.isArray(userChat.body.messages), true);
            assert.equal(userChat.body.messages.some((msg) => msg.content === adminReplyText), true);
        } finally {
            await adminUser.update({ role: prevAdminRole });
        }
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
    runAdminSupportFunctionalTests,
};

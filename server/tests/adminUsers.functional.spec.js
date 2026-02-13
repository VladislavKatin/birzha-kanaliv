const assert = require('node:assert/strict');

const ADMIN_UID = 'seed-firebase-uid-1';
const TARGET_UID = 'seed-firebase-uid-2';

async function runAdminUsersFunctionalTests() {
    process.env.NODE_ENV = 'test';
    const app = require('../app');
    const { User } = require('../models');

    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
        const adminUser = await User.findOne({ where: { firebaseUid: ADMIN_UID } });
        const targetUser = await User.findOne({ where: { firebaseUid: TARGET_UID } });

        assert.equal(!!adminUser, true);
        assert.equal(!!targetUser, true);

        const prevAdminRole = adminUser.role;
        const prevTargetRole = targetUser.role;

        await adminUser.update({ role: 'admin' });
        await targetUser.update({ role: 'user' });

        try {
            const list = await request(baseUrl, {
                method: 'GET',
                path: '/api/admin/users?page=1&limit=10&search=creator.two',
                uid: ADMIN_UID,
            });
            assert.equal(list.status, 200);
            assert.equal(Array.isArray(list.body.users), true);
            assert.equal(list.body.users.length >= 1, true);

            const roleChanged = await request(baseUrl, {
                method: 'PATCH',
                path: `/api/admin/users/${targetUser.id}/role`,
                uid: ADMIN_UID,
                body: { role: 'admin', reason: 'test-role-change' },
            });
            assert.equal(roleChanged.status, 200);
            assert.equal(roleChanged.body.user.role, 'admin');

            const suspended = await request(baseUrl, {
                method: 'PATCH',
                path: `/api/admin/users/${targetUser.id}/suspend`,
                uid: ADMIN_UID,
                body: { suspended: true, reason: 'test-suspend' },
            });
            assert.equal(suspended.status, 200);
            assert.equal(suspended.body.user.role, 'suspended');

            const blockedAuth = await request(baseUrl, {
                method: 'GET',
                path: '/api/auth/me',
                uid: TARGET_UID,
            });
            assert.equal(blockedAuth.status, 403);

            const restored = await request(baseUrl, {
                method: 'PATCH',
                path: `/api/admin/users/${targetUser.id}/suspend`,
                uid: ADMIN_UID,
                body: { suspended: false, reason: 'test-restore' },
            });
            assert.equal(restored.status, 200);
            assert.equal(restored.body.user.role, 'user');

            const allowedAuth = await request(baseUrl, {
                method: 'GET',
                path: '/api/auth/me',
                uid: TARGET_UID,
            });
            assert.equal(allowedAuth.status, 200);
        } finally {
            await adminUser.update({ role: prevAdminRole });
            await targetUser.update({ role: prevTargetRole });
        }
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
}

async function request(baseUrl, { method, path, uid, body }) {
    const headers = {
        'content-type': 'application/json',
    };

    if (uid) {
        headers['x-test-firebase-uid'] = uid;
    }

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

    return {
        status: response.status,
        body: json,
    };
}

module.exports = {
    runAdminUsersFunctionalTests,
};

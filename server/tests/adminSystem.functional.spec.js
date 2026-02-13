const assert = require('node:assert/strict');

const ADMIN_UID = 'seed-firebase-uid-1';
const TARGET_UID = 'seed-firebase-uid-2';

async function runAdminSystemFunctionalTests() {
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

        const prevRole = adminUser.role;
        await adminUser.update({ role: 'admin' });

        try {
            const details = await request(baseUrl, {
                method: 'GET',
                path: `/api/admin/users/${targetUser.id}/details`,
                uid: ADMIN_UID,
            });
            assert.equal(details.status, 200);
            assert.equal(details.body.user?.id, targetUser.id);
            assert.equal(typeof details.body.summary, 'object');
            assert.equal(Array.isArray(details.body.channels), true);

            const insights = await request(baseUrl, {
                method: 'GET',
                path: '/api/admin/system/insights',
                uid: ADMIN_UID,
            });
            assert.equal(insights.status, 200);
            assert.equal(typeof insights.body.summary, 'object');
            assert.equal(Array.isArray(insights.body.topActions), true);
            assert.equal(Array.isArray(insights.body.topIps), true);
        } finally {
            await adminUser.update({ role: prevRole });
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
    runAdminSystemFunctionalTests,
};

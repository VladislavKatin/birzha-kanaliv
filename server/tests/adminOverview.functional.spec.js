const assert = require('node:assert/strict');

const ADMIN_UID = 'seed-firebase-uid-1';
const USER_UID = 'seed-firebase-uid-2';

async function runAdminOverviewFunctionalTests() {
    process.env.NODE_ENV = 'test';
    const app = require('../app');
    const { User } = require('../models');

    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
        const adminUser = await User.findOne({ where: { firebaseUid: ADMIN_UID } });
        const userUser = await User.findOne({ where: { firebaseUid: USER_UID } });

        assert.equal(!!adminUser, true);
        assert.equal(!!userUser, true);

        const prevAdminRole = adminUser.role;
        const prevUserRole = userUser.role;

        await adminUser.update({ role: 'admin' });
        await userUser.update({ role: 'user' });

        try {
            const forbidden = await request(baseUrl, {
                method: 'GET',
                path: '/api/admin/overview',
                uid: USER_UID,
            });
            assert.equal(forbidden.status, 403);

            const allowed = await request(baseUrl, {
                method: 'GET',
                path: '/api/admin/overview',
                uid: ADMIN_UID,
            });

            assert.equal(allowed.status, 200);
            assert.equal(typeof allowed.body.generatedAt, 'string');
            assert.equal(typeof allowed.body.summary.totalUsers, 'number');
            assert.equal(Array.isArray(allowed.body.recent.users), true);
            assert.equal(Array.isArray(allowed.body.recent.matches), true);
            assert.equal(Array.isArray(allowed.body.recent.messages), true);
        } finally {
            await adminUser.update({ role: prevAdminRole });
            await userUser.update({ role: prevUserRole });
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
    runAdminOverviewFunctionalTests,
};

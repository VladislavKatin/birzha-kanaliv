const assert = require('node:assert/strict');

const ADMIN_UID = 'seed-firebase-uid-1';

async function runAdminHistoryFunctionalTests() {
    process.env.NODE_ENV = 'test';
    const app = require('../app');
    const { User } = require('../models');

    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
        const adminUser = await User.findOne({ where: { firebaseUid: ADMIN_UID } });
        assert.equal(!!adminUser, true);

        const prevRole = adminUser.role;
        await adminUser.update({ role: 'admin' });

        try {
            const response = await request(baseUrl, {
                method: 'GET',
                path: '/api/admin/exchange-history?page=1&limit=10',
                uid: ADMIN_UID,
            });

            assert.equal(response.status, 200);
            assert.equal(Array.isArray(response.body.matches), true);
            assert.equal(typeof response.body.summary, 'object');
            assert.equal(Array.isArray(response.body.summary.statuses), true);
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
    runAdminHistoryFunctionalTests,
};

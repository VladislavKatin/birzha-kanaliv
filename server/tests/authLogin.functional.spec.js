const assert = require('node:assert/strict');

async function runAuthLoginFunctionalTests() {
    process.env.NODE_ENV = 'test';
    const app = require('../app');
    const { User } = require('../models');

    const existingUser = await User.findOne({
        where: { firebaseUid: 'seed-firebase-uid-1' },
    });

    assert.ok(existingUser);

    const originalUid = existingUser.firebaseUid;
    const reusedEmail = existingUser.email;
    const nextUid = `seed-firebase-uid-relinked-${Date.now()}`;

    const server = app.listen(0);
    const port = server.address().port;

    try {
        const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-test-firebase-uid': nextUid,
                'x-test-email': reusedEmail,
                'x-test-name': 'Relinked Test User',
            },
            body: JSON.stringify({}),
        });

        const body = await response.json();

        assert.equal(response.status, 200);
        assert.equal(body.user.email, reusedEmail);
        assert.equal(body.user.id, existingUser.id);

        await existingUser.reload();
        assert.equal(existingUser.firebaseUid, nextUid);
        assert.equal(typeof existingUser.displayName, 'string');
        assert.equal(existingUser.displayName.length > 0, true);
    } finally {
        await existingUser.update({ firebaseUid: originalUid });
        await new Promise((resolve) => server.close(resolve));
    }
}

module.exports = {
    runAuthLoginFunctionalTests,
};

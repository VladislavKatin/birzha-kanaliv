const assert = require('node:assert/strict');

const ADMIN_UID = 'seed-firebase-uid-1';

async function runAdminModerationFunctionalTests() {
    process.env.NODE_ENV = 'test';
    const app = require('../app');
    const { User, YouTubeAccount, TrafficOffer, TrafficMatch } = require('../models');

    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    let adminUser;
    let channel;
    let offer;
    let match;

    try {
        adminUser = await User.findOne({ where: { firebaseUid: ADMIN_UID } });
        assert.equal(!!adminUser, true);

        const prevAdminRole = adminUser.role;
        await adminUser.update({ role: 'admin' });

        channel = await YouTubeAccount.findOne({ order: [['createdAt', 'DESC']] });
        offer = await TrafficOffer.findOne({ order: [['createdAt', 'DESC']] });
        match = await TrafficMatch.findOne({ order: [['updatedAt', 'DESC']] });

        assert.equal(!!channel, true);
        assert.equal(!!offer, true);
        assert.equal(!!match, true);

        const prevChannel = { isFlagged: channel.isFlagged, flagReason: channel.flagReason, isActive: channel.isActive };
        const prevOfferStatus = offer.status;
        const prevMatchStatus = match.status;

        try {
            const channelsList = await request(baseUrl, {
                method: 'GET',
                path: '/api/admin/channels?page=1&limit=10',
                uid: ADMIN_UID,
            });
            assert.equal(channelsList.status, 200);
            assert.equal(Array.isArray(channelsList.body.channels), true);

            const flagged = await request(baseUrl, {
                method: 'PATCH',
                path: `/api/admin/channels/${channel.id}/flag`,
                uid: ADMIN_UID,
                body: { isFlagged: true, reason: 'test-flag' },
            });
            assert.equal(flagged.status, 200);
            assert.equal(flagged.body.channel.isFlagged, true);

            const deactivated = await request(baseUrl, {
                method: 'PATCH',
                path: `/api/admin/channels/${channel.id}/active`,
                uid: ADMIN_UID,
                body: { isActive: false, reason: 'test-deactivate' },
            });
            assert.equal(deactivated.status, 200);
            assert.equal(deactivated.body.channel.isActive, false);

            const offersList = await request(baseUrl, {
                method: 'GET',
                path: '/api/admin/offers?page=1&limit=10',
                uid: ADMIN_UID,
            });
            assert.equal(offersList.status, 200);
            assert.equal(Array.isArray(offersList.body.offers), true);

            const offerUpdated = await request(baseUrl, {
                method: 'PATCH',
                path: `/api/admin/offers/${offer.id}/status`,
                uid: ADMIN_UID,
                body: { status: 'completed', reason: 'test-offer-status' },
            });
            assert.equal(offerUpdated.status, 200);
            assert.equal(offerUpdated.body.offer.status, 'completed');

            const matchesList = await request(baseUrl, {
                method: 'GET',
                path: '/api/admin/matches?page=1&limit=10',
                uid: ADMIN_UID,
            });
            assert.equal(matchesList.status, 200);
            assert.equal(Array.isArray(matchesList.body.matches), true);

            const matchUpdated = await request(baseUrl, {
                method: 'PATCH',
                path: `/api/admin/matches/${match.id}/status`,
                uid: ADMIN_UID,
                body: { status: 'rejected', reason: 'test-match-status' },
            });
            assert.equal(matchUpdated.status, 200);
            assert.equal(matchUpdated.body.match.status, 'rejected');
        } finally {
            await channel.update(prevChannel);
            await offer.update({ status: prevOfferStatus });
            await match.update({ status: prevMatchStatus });
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
    runAdminModerationFunctionalTests,
};

const assert = require('node:assert/strict');

const ADMIN_UID = 'seed-firebase-uid-1';

async function runAdminOpsFunctionalTests() {
    process.env.NODE_ENV = 'test';
    const app = require('../app');
    const { User, YouTubeAccount, TrafficOffer } = require('../models');

    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    let demoChannel;
    let demoOffer;

    try {
        const adminUser = await User.findOne({ where: { firebaseUid: ADMIN_UID } });
        assert.equal(!!adminUser, true);

        const prevRole = adminUser.role;
        await adminUser.update({ role: 'admin' });

        demoChannel = await YouTubeAccount.findOne({ where: { channelId: { [require('sequelize').Op.iLike]: 'UC_DEMO_%' } } });
        assert.equal(!!demoChannel, true);

        demoOffer = await TrafficOffer.findOne({ where: { channelId: demoChannel.id } });
        assert.equal(!!demoOffer, true);

        const prevChannelActive = demoChannel.isActive;
        const prevOfferStatus = demoOffer.status;

        try {
            const incidents = await request(baseUrl, {
                method: 'GET',
                path: '/api/admin/incidents?range=24h',
                uid: ADMIN_UID,
            });
            assert.equal(incidents.status, 200);
            assert.equal(Array.isArray(incidents.body.incidents), true);

            const demoList = await request(baseUrl, {
                method: 'GET',
                path: '/api/admin/demo/channels',
                uid: ADMIN_UID,
            });
            assert.equal(demoList.status, 200);
            assert.equal(Array.isArray(demoList.body.channels), true);

            const channelUpdate = await request(baseUrl, {
                method: 'PATCH',
                path: `/api/admin/demo/channels/${demoChannel.id}/active`,
                uid: ADMIN_UID,
                body: { isActive: !prevChannelActive, reason: 'test-demo-channel-toggle' },
            });
            assert.equal(channelUpdate.status, 200);
            assert.equal(channelUpdate.body.channel.isActive, !prevChannelActive);

            const nextOfferStatus = prevOfferStatus === 'open' ? 'matched' : 'open';
            const offerUpdate = await request(baseUrl, {
                method: 'PATCH',
                path: `/api/admin/demo/offers/${demoOffer.id}/status`,
                uid: ADMIN_UID,
                body: { status: nextOfferStatus, reason: 'test-demo-offer-status' },
            });
            assert.equal(offerUpdate.status, 200);
            assert.equal(offerUpdate.body.offer.status, nextOfferStatus);

            const usersCsv = await request(baseUrl, {
                method: 'GET',
                path: '/api/admin/exports/users.csv',
                uid: ADMIN_UID,
                expectText: true,
            });
            assert.equal(usersCsv.status, 200);
            assert.equal(String(usersCsv.body).includes('email'), true);

            const exchangesCsv = await request(baseUrl, {
                method: 'GET',
                path: '/api/admin/exports/exchanges.csv',
                uid: ADMIN_UID,
                expectText: true,
            });
            assert.equal(exchangesCsv.status, 200);
            assert.equal(String(exchangesCsv.body).includes('offerType'), true);

            const supportCsv = await request(baseUrl, {
                method: 'GET',
                path: '/api/admin/exports/support.csv',
                uid: ADMIN_UID,
                expectText: true,
            });
            assert.equal(supportCsv.status, 200);
            assert.equal(String(supportCsv.body).includes('senderEmail'), true);
        } finally {
            await demoChannel.update({ isActive: prevChannelActive });
            await demoOffer.update({ status: prevOfferStatus });
            await adminUser.update({ role: prevRole });
        }
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
}

async function request(baseUrl, { method, path, uid, body, expectText = false }) {
    const headers = { 'content-type': 'application/json' };
    if (uid) headers['x-test-firebase-uid'] = uid;

    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    if (expectText) {
        return { status: response.status, body: text };
    }

    let json;
    try {
        json = text ? JSON.parse(text) : {};
    } catch {
        json = { raw: text };
    }

    return { status: response.status, body: json };
}

module.exports = {
    runAdminOpsFunctionalTests,
};

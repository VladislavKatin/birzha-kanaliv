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

        demoOffer = await TrafficOffer.findOne({
            include: [{
                model: YouTubeAccount,
                as: 'channel',
                attributes: ['id', 'channelId'],
                where: { channelId: { [require('sequelize').Op.iLike]: 'UC_DEMO_%' } },
            }],
        });
        if (demoOffer) {
            demoChannel = await YouTubeAccount.findByPk(demoOffer.channelId);
            assert.equal(!!demoChannel, true);
        }

        const prevChannelActive = demoChannel?.isActive ?? true;
        const prevOfferStatus = demoOffer?.status ?? 'open';
        let prevLimits = null;

        try {
            const incidents = await request(baseUrl, {
                method: 'GET',
                path: '/api/admin/incidents?range=24h',
                uid: ADMIN_UID,
            });
            assert.equal(incidents.status, 200);
            assert.equal(Array.isArray(incidents.body.incidents), true);
            assert.equal(typeof incidents.body.summaryByLevel, 'object');
            assert.equal(Array.isArray(incidents.body.topActions), true);

            const limitsRead = await request(baseUrl, {
                method: 'GET',
                path: '/api/admin/system/limits',
                uid: ADMIN_UID,
            });
            assert.equal(limitsRead.status, 200);
            assert.equal(typeof limitsRead.body.limits, 'object');
            prevLimits = limitsRead.body.limits;

            const limitsUpdate = await request(baseUrl, {
                method: 'PATCH',
                path: '/api/admin/system/limits',
                uid: ADMIN_UID,
                body: {
                    offersPerWeek: 7,
                    activeExchangesPerChannel: 4,
                    reason: 'test-update-limits',
                },
            });
            assert.equal(limitsUpdate.status, 200);
            assert.equal(limitsUpdate.body.limits.offersPerWeek, 7);
            assert.equal(limitsUpdate.body.limits.activeExchangesPerChannel, 4);

            const demoList = await request(baseUrl, {
                method: 'GET',
                path: '/api/admin/demo/channels',
                uid: ADMIN_UID,
            });
            assert.equal(demoList.status, 200);
            assert.equal(Array.isArray(demoList.body.channels), true);

            if (demoChannel && demoOffer) {
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
            }

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

            const exportHistory = await request(baseUrl, {
                method: 'GET',
                path: '/api/admin/exports/history',
                uid: ADMIN_UID,
            });
            assert.equal(exportHistory.status, 200);
            assert.equal(Array.isArray(exportHistory.body.items), true);
        } finally {
            if (prevLimits) {
                await request(baseUrl, {
                    method: 'PATCH',
                    path: '/api/admin/system/limits',
                    uid: ADMIN_UID,
                    body: {
                        offersPerWeek: prevLimits.offersPerWeek,
                        activeExchangesPerChannel: prevLimits.activeExchangesPerChannel,
                        reason: 'restore-limits-after-test',
                    },
                });
            }
            if (demoChannel) {
                await demoChannel.update({ isActive: prevChannelActive });
            }
            if (demoOffer) {
                await demoOffer.update({ status: prevOfferStatus });
            }
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

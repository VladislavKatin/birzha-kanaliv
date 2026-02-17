const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { User, YouTubeAccount, TrafficOffer, TrafficMatch } = require('../models');

const OFFER_OWNER_UID = 'seed-firebase-uid-1';
const OFFER_OWNER_CHANNEL_ID = '33333333-3333-4333-8333-333333333333';
const MATCHED_OFFER_ID = '55555555-5555-4555-8555-555555555555';

async function runOfferMultiMatchFunctionalTests() {
    process.env.NODE_ENV = 'test';
    const app = require('../app');

    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    const extraUid = `seed-firebase-uid-extra-${randomUUID()}`;
    const extraUserId = randomUUID();
    const extraChannelId = randomUUID();
    const extraChannelPublicId = `UC_EXTRA_${randomUUID().replace(/-/g, '').toUpperCase().slice(0, 20)}`;
    let openOfferId = null;

    try {
        await User.create({
            id: extraUserId,
            firebaseUid: extraUid,
            email: `${extraUid}@example.test`,
            displayName: 'Extra Test User',
            role: 'user',
            notificationPrefs: {
                email_new_proposal: true,
                email_message: true,
                email_deal_complete: true,
                telegram: false,
                webpush: false,
            },
        });

        await YouTubeAccount.create({
            id: extraChannelId,
            userId: extraUserId,
            channelId: extraChannelPublicId,
            channelTitle: 'Extra Test Channel',
            channelAvatar: null,
            description: 'Channel for offer multi-match tests',
            subscribers: 15000,
            totalViews: 500000,
            totalVideos: 120,
            avgViews30d: 12000,
            subGrowth30d: 250,
            averageWatchTime: 5.2,
            ctr: 4.1,
            niche: 'tech',
            language: 'uk',
            country: 'UA',
            recentVideos: [],
            accessToken: null,
            refreshToken: null,
            verified: true,
            isActive: true,
            isFlagged: false,
        });

        const respondMatched = await request(baseUrl, {
            method: 'POST',
            path: `/api/offers/${MATCHED_OFFER_ID}/respond`,
            uid: extraUid,
            body: { channelId: extraChannelId },
        });

        assert.equal(respondMatched.status, 201);
        assert.equal(respondMatched.body.match.offerId, MATCHED_OFFER_ID);
        assert.equal(respondMatched.body.match.status, 'pending');

        const createOpenOffer = await request(baseUrl, {
            method: 'POST',
            path: '/api/offers',
            uid: OFFER_OWNER_UID,
            body: {
                channelId: OFFER_OWNER_CHANNEL_ID,
                type: 'subs',
                description: `open-offer-${Date.now()}`,
                niche: 'tech',
                language: 'uk',
            },
        });

        assert.equal(createOpenOffer.status, 201);
        openOfferId = createOpenOffer.body.offer.id;

        const respondOpenOffer = await request(baseUrl, {
            method: 'POST',
            path: `/api/offers/${openOfferId}/respond`,
            uid: extraUid,
            body: { channelId: extraChannelId },
        });

        assert.equal(respondOpenOffer.status, 201);

        const openOffer = await TrafficOffer.findByPk(openOfferId);
        assert.ok(openOffer);
        assert.equal(openOffer.status, 'open');
    } finally {
        await TrafficMatch.destroy({
            where: { initiatorChannelId: extraChannelId },
        });

        if (openOfferId) {
            await TrafficOffer.destroy({
                where: { id: openOfferId },
            });
        }

        await YouTubeAccount.destroy({
            where: { id: extraChannelId },
        });

        await User.destroy({
            where: { id: extraUserId },
        });

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
    runOfferMultiMatchFunctionalTests,
};

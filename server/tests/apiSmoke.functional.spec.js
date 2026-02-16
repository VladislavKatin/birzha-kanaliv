const assert = require('node:assert/strict');

const OFFER_OWNER_UID = 'seed-firebase-uid-1';
const RESPONDER_UID = 'seed-firebase-uid-2';
const OFFER_OWNER_CHANNEL_ID = '33333333-3333-4333-8333-333333333333';
const RESPONDER_CHANNEL_ID = '44444444-4444-4444-8444-444444444444';

async function runApiSmokeFunctionalTests() {
    process.env.NODE_ENV = 'test';
    const app = require('../app');

    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
        await smokeAuthMe(baseUrl);
        await smokeNotificationSettings(baseUrl);
        await smokeOffersList(baseUrl);
        await smokeOfferDetailsPublic(baseUrl);

        const primaryFlow = await createAndProgressMatchFlow(baseUrl, {
            offerOwnerUid: OFFER_OWNER_UID,
            offerOwnerChannelId: OFFER_OWNER_CHANNEL_ID,
            responderUid: RESPONDER_UID,
            responderChannelId: RESPONDER_CHANNEL_ID,
            label: 'primary',
        });

        await smokeChatSend(baseUrl, primaryFlow.matchId, OFFER_OWNER_UID);
        await smokeMatchCompleteViaChat(baseUrl, primaryFlow.matchId, OFFER_OWNER_UID, RESPONDER_UID);
        await smokeReviewCreate(baseUrl, primaryFlow.matchId, OFFER_OWNER_UID);

        const declineFlow = await createAndProgressMatchFlow(baseUrl, {
            offerOwnerUid: OFFER_OWNER_UID,
            offerOwnerChannelId: OFFER_OWNER_CHANNEL_ID,
            responderUid: RESPONDER_UID,
            responderChannelId: RESPONDER_CHANNEL_ID,
            label: 'decline',
            accept: false,
        });

        await smokeIncomingSwapsFilters(baseUrl);
        await smokeOutgoingSwapsFilters(baseUrl);
        await smokeSwapDefer(baseUrl, declineFlow.matchId, OFFER_OWNER_UID);
        await smokeSwapDecline(baseUrl, declineFlow.matchId, RESPONDER_UID);

        const bulkFlow = await createAndProgressMatchFlow(baseUrl, {
            offerOwnerUid: OFFER_OWNER_UID,
            offerOwnerChannelId: OFFER_OWNER_CHANNEL_ID,
            responderUid: RESPONDER_UID,
            responderChannelId: RESPONDER_CHANNEL_ID,
            label: 'bulk',
            accept: false,
        });
        await smokeBulkSwapActions(baseUrl, bulkFlow.matchId, OFFER_OWNER_UID);
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
}

async function smokeAuthMe(baseUrl) {
    const response = await request(baseUrl, {
        method: 'GET',
        path: '/api/auth/me',
        uid: OFFER_OWNER_UID,
    });

    assert.equal(response.status, 200);
    assert.equal(!!response.body.user, true);
}

async function smokeNotificationSettings(baseUrl) {
    const telegramLink = await request(baseUrl, {
        method: 'GET',
        path: '/api/profile/notifications/telegram-link',
        uid: OFFER_OWNER_UID,
    });
    assert.equal(telegramLink.status, 200);
    assert.equal(typeof telegramLink.body.configured, 'boolean');
    assert.equal(typeof telegramLink.body.connected, 'boolean');

    const invalidEnable = await request(baseUrl, {
        method: 'PUT',
        path: '/api/profile/notifications',
        uid: OFFER_OWNER_UID,
        body: {
            notificationPrefs: {
                telegram: true,
            },
        },
    });
    assert.equal(invalidEnable.status, 400);
}

async function smokeOffersList(baseUrl) {
    const response = await request(baseUrl, {
        method: 'GET',
        path: '/api/offers',
    });

    assert.equal(response.status, 200);
    assert.equal(Array.isArray(response.body.offers), true);
}

async function smokeOfferDetailsPublic(baseUrl) {
    const listed = await request(baseUrl, {
        method: 'GET',
        path: '/api/offers',
    });

    assert.equal(listed.status, 200);
    assert.equal(Array.isArray(listed.body.offers), true);
    assert.equal(listed.body.offers.length > 0, true);

    const offerId = listed.body.offers[0].id;
    const detail = await request(baseUrl, {
        method: 'GET',
        path: `/api/offers/${offerId}`,
    });

    assert.equal(detail.status, 200);
    assert.equal(detail.body.offer.id, offerId);
}

async function createAndProgressMatchFlow(baseUrl, {
    offerOwnerUid,
    offerOwnerChannelId,
    responderUid,
    responderChannelId,
    label,
    accept = true,
}) {
    const createdOffer = await request(baseUrl, {
        method: 'POST',
        path: '/api/offers',
        uid: offerOwnerUid,
        body: {
            channelId: offerOwnerChannelId,
            type: 'views',
            description: `smoke-offer-${label}-${Date.now()}`,
            niche: 'smoke',
            language: 'en',
            minSubscribers: 0,
            maxSubscribers: 0,
        },
    });

    assert.equal(createdOffer.status, 201);
    const offerId = createdOffer.body.offer.id;

    const responded = await request(baseUrl, {
        method: 'POST',
        path: `/api/offers/${offerId}/respond`,
        uid: responderUid,
        body: { channelId: responderChannelId },
    });

    assert.equal(responded.status, 201);
    const matchId = responded.body.match.id;

    if (accept) {
        const accepted = await request(baseUrl, {
            method: 'POST',
            path: `/api/swaps/${matchId}/accept`,
            uid: offerOwnerUid,
        });
        assert.equal(accepted.status, 200);
    }

    return { offerId, matchId };
}

async function smokeIncomingSwapsFilters(baseUrl) {
    const allIncoming = await request(baseUrl, {
        method: 'GET',
        path: '/api/swaps/incoming',
        uid: OFFER_OWNER_UID,
    });

    assert.equal(allIncoming.status, 200);
    assert.equal(Array.isArray(allIncoming.body.swaps), true);

    const filtered = await request(baseUrl, {
        method: 'GET',
        path: '/api/swaps/incoming?status=pending&sort=largest&search=smoke-offer-decline',
        uid: OFFER_OWNER_UID,
    });

    assert.equal(filtered.status, 200);
    assert.equal(Array.isArray(filtered.body.swaps), true);
    assert.equal(
        filtered.body.swaps.every((swap) => swap.status === 'pending'),
        true
    );
    if (filtered.body.swaps.length > 0) {
        const sample = filtered.body.swaps[0];
        assert.equal(typeof sample.partnerStats?.influenceScore, 'number');
        assert.equal(Array.isArray(sample.compatibility?.reasons), true);
    }
}

async function smokeOutgoingSwapsFilters(baseUrl) {
    const allOutgoing = await request(baseUrl, {
        method: 'GET',
        path: '/api/swaps/outgoing',
        uid: RESPONDER_UID,
    });

    assert.equal(allOutgoing.status, 200);
    assert.equal(Array.isArray(allOutgoing.body.swaps), true);

    const filtered = await request(baseUrl, {
        method: 'GET',
        path: '/api/swaps/outgoing?status=pending&sort=relevance&search=smoke-offer-decline',
        uid: RESPONDER_UID,
    });

    assert.equal(filtered.status, 200);
    assert.equal(Array.isArray(filtered.body.swaps), true);
    assert.equal(
        filtered.body.swaps.every((swap) => swap.status === 'pending'),
        true
    );
    if (filtered.body.swaps.length > 0) {
        const sample = filtered.body.swaps[0];
        assert.equal(typeof sample.partnerStats?.influenceScore, 'number');
        assert.equal(Array.isArray(sample.compatibility?.reasons), true);
    }
}

async function smokeSwapDefer(baseUrl, matchId, uid) {
    const response = await request(baseUrl, {
        method: 'POST',
        path: `/api/swaps/${matchId}/defer`,
        uid,
        body: { note: 'smoke defer note' },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assert.equal(typeof response.body.deferredUntil, 'string');

    const incoming = await request(baseUrl, {
        method: 'GET',
        path: '/api/swaps/incoming?status=pending',
        uid: OFFER_OWNER_UID,
    });
    assert.equal(incoming.status, 200);
    const deferred = (incoming.body.swaps || []).find((swap) => swap.id === matchId);
    assert.equal(!!deferred, true);
    assert.equal(deferred.deferredByMe, true);
}

async function smokeSwapDecline(baseUrl, matchId, uid) {
    const { ActionLog } = require('../models');
    const response = await request(baseUrl, {
        method: 'POST',
        path: `/api/swaps/${matchId}/decline`,
        uid,
        body: { reason: 'Невідповідна ніша: smoke test reason' },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.match.status, 'rejected');

    const logs = await ActionLog.findAll({
        where: { action: 'swap_declined' },
        order: [['createdAt', 'DESC']],
        limit: 30,
    });

    const relevant = logs.find((entry) => entry.details?.matchId === matchId);
    assert.equal(!!relevant, true);
    assert.equal(String(relevant.details?.reason || '').includes('smoke test reason'), true);
}

async function smokeBulkSwapActions(baseUrl, matchId, uid) {
    const deferRes = await request(baseUrl, {
        method: 'POST',
        path: '/api/swaps/bulk-action',
        uid,
        body: {
            action: 'defer',
            matchIds: [matchId],
            reason: 'bulk defer smoke',
        },
    });
    assert.equal(deferRes.status, 200);
    assert.equal(Array.isArray(deferRes.body.processed), true);
    assert.equal(deferRes.body.processed.some((item) => item.matchId === matchId), true);

    const declineRes = await request(baseUrl, {
        method: 'POST',
        path: '/api/swaps/bulk-action',
        uid,
        body: {
            action: 'decline',
            matchIds: [matchId],
            reason: 'bulk decline smoke',
        },
    });
    assert.equal(declineRes.status, 200);
    assert.equal(declineRes.body.processed.some((item) => item.matchId === matchId), true);
}

async function smokeChatSend(baseUrl, matchId, uid) {
    const response = await request(baseUrl, {
        method: 'POST',
        path: `/api/chat/${matchId}/messages`,
        uid,
        body: { content: 'smoke chat message' },
    });

    assert.equal(response.status, 201);
    assert.equal(!!response.body.message, true);

    const imageResponse = await request(baseUrl, {
        method: 'POST',
        path: `/api/chat/${matchId}/messages`,
        uid,
        body: {
            content: '',
            imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6Xn4sAAAAASUVORK5CYII=',
        },
    });

    assert.equal(imageResponse.status, 201);
    assert.equal(typeof imageResponse.body.message.imageData, 'string');
    assert.equal(imageResponse.body.message.imageData.startsWith('data:image/'), true);
}

async function smokeMatchCompleteViaChat(baseUrl, matchId, firstUid, secondUid) {
    const first = await request(baseUrl, {
        method: 'POST',
        path: `/api/chat/${matchId}/complete`,
        uid: firstUid,
    });
    assert.equal(first.status, 200);

    const second = await request(baseUrl, {
        method: 'POST',
        path: `/api/chat/${matchId}/complete`,
        uid: secondUid,
    });
    assert.equal(second.status, 200);
    assert.equal(second.body.match.status, 'completed');
}

async function smokeReviewCreate(baseUrl, matchId, uid) {
    const response = await request(baseUrl, {
        method: 'POST',
        path: '/api/reviews',
        uid,
        body: {
            matchId,
            rating: 5,
            comment: 'smoke review',
        },
    });

    assert.equal(response.status, 201);
    assert.equal(!!response.body.review, true);
}

async function request(baseUrl, {
    method,
    path,
    uid,
    body,
}) {
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
    runApiSmokeFunctionalTests,
};


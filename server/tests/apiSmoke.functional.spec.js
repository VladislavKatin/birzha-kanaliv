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

        await smokeSwapDecline(baseUrl, declineFlow.matchId, RESPONDER_UID);
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

async function smokeSwapDecline(baseUrl, matchId, uid) {
    const response = await request(baseUrl, {
        method: 'POST',
        path: `/api/swaps/${matchId}/decline`,
        uid,
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.match.status, 'rejected');
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

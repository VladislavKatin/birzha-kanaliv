const assert = require('node:assert/strict');
const { listPublishedReviews } = require('../services/reviewReadService');

async function runReviewReadFunctionalTests() {
    const calls = [];
    const reviews = [{ id: 'r1', rating: 5 }, { id: 'r2', rating: 3 }];

    const Review = {
        async findAll(query) {
            calls.push(query);
            return reviews;
        },
    };

    const YouTubeAccount = { model: 'YouTubeAccount' };

    const result = await listPublishedReviews({
        Review,
        YouTubeAccount,
        channelId: 'channel-1',
        fromChannelAttributes: ['channelTitle', 'channelAvatar'],
        limit: 20,
    });

    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].where, {
        toChannelId: 'channel-1',
        isPublished: true,
    });
    assert.equal(calls[0].limit, 20);
    assert.deepEqual(result.reviews, reviews);
    assert.deepEqual(result.rating, { average: 4, count: 2 });
}

module.exports = {
    runReviewReadFunctionalTests,
};

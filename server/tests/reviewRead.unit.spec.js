const assert = require('node:assert/strict');
const { calculateRatingSummary } = require('../services/reviewReadService');

function runReviewReadUnitTests() {
    assert.deepEqual(calculateRatingSummary([]), { average: 0, count: 0 });

    assert.deepEqual(
        calculateRatingSummary([{ rating: 5 }, { rating: 4 }, { rating: 3 }]),
        { average: 4, count: 3 }
    );

    assert.deepEqual(
        calculateRatingSummary([{ rating: 5 }, { rating: 4 }]),
        { average: 4.5, count: 2 }
    );
}

module.exports = {
    runReviewReadUnitTests,
};

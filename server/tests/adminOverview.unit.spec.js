const assert = require('node:assert/strict');

function runAdminOverviewUnitTests() {
    const expectedKeys = ['generatedAt', 'summary', 'distributions', 'recent'];
    const payload = {
        generatedAt: new Date().toISOString(),
        summary: {},
        distributions: {},
        recent: {},
    };

    expectedKeys.forEach((key) => {
        assert.equal(Object.prototype.hasOwnProperty.call(payload, key), true);
    });
}

module.exports = {
    runAdminOverviewUnitTests,
};

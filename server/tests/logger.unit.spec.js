const assert = require('node:assert/strict');
const { sanitizeMeta, buildLogPayload } = require('../services/logger');

function runLoggerUnitTests() {
    const sanitized = sanitizeMeta({
        code: 500,
        traceId: 'trace-1',
        err: new Error('boom'),
        value: BigInt(12),
    });

    assert.equal(sanitized.code, 500);
    assert.equal(sanitized.traceId, 'trace-1');
    assert.equal(sanitized.err.message, 'boom');
    assert.equal(sanitized.value, '12');

    const payload = buildLogPayload('info', 'auth.login', { uid: 'u1' });
    assert.equal(payload.level, 'info');
    assert.equal(payload.event, 'auth.login');
    assert.equal(payload.uid, 'u1');
    assert.ok(payload.timestamp);
}

module.exports = {
    runLoggerUnitTests,
};

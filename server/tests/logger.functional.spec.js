const assert = require('node:assert/strict');
const { logInfo, logWarn, logError } = require('../services/logger');

async function runLoggerFunctionalTests() {
    const original = {
        log: console.log,
        warn: console.warn,
        error: console.error,
    };

    const output = {
        log: [],
        warn: [],
        error: [],
    };

    try {
        console.log = (line) => output.log.push(line);
        console.warn = (line) => output.warn.push(line);
        console.error = (line) => output.error.push(line);

        logInfo('auth.login.success', { userId: 'u-1' });
        logWarn('youtube.callback.partial', { reason: 'analytics_failed' });
        logError('chat.send.failed', { statusCode: 500 });
    } finally {
        console.log = original.log;
        console.warn = original.warn;
        console.error = original.error;
    }

    const infoPayload = JSON.parse(output.log[0]);
    const warnPayload = JSON.parse(output.warn[0]);
    const errorPayload = JSON.parse(output.error[0]);

    assert.equal(infoPayload.event, 'auth.login.success');
    assert.equal(warnPayload.level, 'warn');
    assert.equal(errorPayload.statusCode, 500);
}

module.exports = {
    runLoggerFunctionalTests,
};

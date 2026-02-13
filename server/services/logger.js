function sanitizeMeta(meta) {
    if (!meta || typeof meta !== 'object') {
        return {};
    }

    const result = {};
    Object.entries(meta).forEach(([key, value]) => {
        if (value instanceof Error) {
            result[key] = {
                message: value.message,
                name: value.name,
            };
            return;
        }

        if (typeof value === 'bigint') {
            result[key] = value.toString();
            return;
        }

        result[key] = value;
    });

    return result;
}

function buildLogPayload(level, event, meta = {}) {
    return {
        timestamp: new Date().toISOString(),
        level,
        event,
        ...sanitizeMeta(meta),
    };
}

function writeLog(method, level, event, meta) {
    const payload = buildLogPayload(level, event, meta);
    method(JSON.stringify(payload));
}

function logInfo(event, meta) {
    writeLog(console.log, 'info', event, meta);
}

function logWarn(event, meta) {
    writeLog(console.warn, 'warn', event, meta);
}

function logError(event, meta) {
    writeLog(console.error, 'error', event, meta);
}

module.exports = {
    sanitizeMeta,
    buildLogPayload,
    logInfo,
    logWarn,
    logError,
};

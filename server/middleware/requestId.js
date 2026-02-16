const crypto = require('crypto');

function requestId(req, res, next) {
    const incoming = req.headers['x-request-id'];
    const requestId = typeof incoming === 'string' && incoming.trim()
        ? incoming.trim()
        : crypto.randomUUID();

    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
}

module.exports = requestId;

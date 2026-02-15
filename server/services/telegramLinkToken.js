const crypto = require('crypto');

const DEFAULT_TTL_SECONDS = 15 * 60;

function base64UrlEncode(value) {
    return Buffer.from(String(value), 'utf8').toString('base64url');
}

function base64UrlDecode(value) {
    return Buffer.from(String(value), 'base64url').toString('utf8');
}

function getSigningSecret() {
    return process.env.TELEGRAM_LINK_SECRET || process.env.FIREBASE_PROJECT_ID || 'youtoobe-telegram-link-secret';
}

function createTelegramLinkToken(userId, expiresInSeconds = DEFAULT_TTL_SECONDS) {
    const exp = Math.floor(Date.now() / 1000) + Number(expiresInSeconds || DEFAULT_TTL_SECONDS);
    const payload = `${String(userId)}:${exp}`;
    const payloadPart = base64UrlEncode(payload);
    const signaturePart = crypto.createHmac('sha256', getSigningSecret()).update(payloadPart).digest('base64url');
    return `${payloadPart}.${signaturePart}`;
}

function verifyTelegramLinkToken(token) {
    const [payloadPart, signaturePart] = String(token || '').split('.');
    if (!payloadPart || !signaturePart) {
        return { valid: false, reason: 'malformed' };
    }

    const expectedSignature = crypto.createHmac('sha256', getSigningSecret()).update(payloadPart).digest('base64url');
    const signatureBuffer = Buffer.from(signaturePart);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (signatureBuffer.length !== expectedBuffer.length) {
        return { valid: false, reason: 'signature' };
    }
    const signatureIsValid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    if (!signatureIsValid) {
        return { valid: false, reason: 'signature' };
    }

    const payloadRaw = base64UrlDecode(payloadPart);
    const [userId, expRaw] = payloadRaw.split(':');
    const exp = Number(expRaw);
    if (!userId || !Number.isFinite(exp)) {
        return { valid: false, reason: 'payload' };
    }

    if (Math.floor(Date.now() / 1000) > exp) {
        return { valid: false, reason: 'expired' };
    }

    return { valid: true, userId, exp };
}

module.exports = {
    createTelegramLinkToken,
    verifyTelegramLinkToken,
};

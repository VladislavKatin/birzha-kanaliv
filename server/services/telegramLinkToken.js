const crypto = require('crypto');

const DEFAULT_TTL_SECONDS = 15 * 60;

function getSigningSecret() {
    return process.env.TELEGRAM_LINK_SECRET || process.env.FIREBASE_PROJECT_ID || 'youtoobe-telegram-link-secret';
}

function uuidToCompact(value) {
    return String(value || '').replace(/-/g, '').toLowerCase();
}

function compactToUuid(compact) {
    const value = String(compact || '').toLowerCase();
    if (!/^[a-f0-9]{32}$/.test(value)) return null;
    return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

function createTelegramLinkToken(userId, expiresInSeconds = DEFAULT_TTL_SECONDS) {
    const exp = Math.floor(Date.now() / 1000) + Number(expiresInSeconds || DEFAULT_TTL_SECONDS);
    const compactUserId = uuidToCompact(userId);
    const expPart = exp.toString(36);
    const signaturePart = crypto
        .createHmac('sha256', getSigningSecret())
        .update(`${compactUserId}:${expPart}`)
        .digest('hex')
        .slice(0, 16);
    // Telegram deep-link payload must stay short and URL-safe.
    return `${compactUserId}_${expPart}_${signaturePart}`;
}

function verifyTelegramLinkToken(token) {
    const [compactUserId, expPart, signaturePart] = String(token || '').trim().split('_');
    if (!compactUserId || !expPart || !signaturePart) {
        return { valid: false, reason: 'malformed' };
    }

    const expectedSignature = crypto
        .createHmac('sha256', getSigningSecret())
        .update(`${compactUserId}:${expPart}`)
        .digest('hex')
        .slice(0, 16);
    const signatureBuffer = Buffer.from(signaturePart);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (signatureBuffer.length !== expectedBuffer.length) {
        return { valid: false, reason: 'signature' };
    }
    const signatureIsValid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    if (!signatureIsValid) {
        return { valid: false, reason: 'signature' };
    }

    const userId = compactToUuid(compactUserId);
    const exp = parseInt(expPart, 36);
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

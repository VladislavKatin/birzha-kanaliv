const crypto = require('crypto');

const DEFAULT_TTL_MS = 10 * 60 * 1000;

function getStateSecret() {
    const secret = process.env.OAUTH_STATE_SECRET || '';
    if (!secret && process.env.NODE_ENV !== 'production') {
        return 'dev-oauth-state-secret-change-me';
    }
    if (!secret) {
        throw new Error('OAUTH_STATE_SECRET is required');
    }
    return secret;
}

function signPayload(payload) {
    return crypto
        .createHmac('sha256', getStateSecret())
        .update(payload)
        .digest('base64url');
}

function encodeState({ firebaseUid, redirectOrigin }) {
    const body = {
        firebaseUid: firebaseUid || null,
        redirectOrigin: redirectOrigin || null,
        iat: Date.now(),
    };
    const encodedBody = Buffer.from(JSON.stringify(body), 'utf8').toString('base64url');
    const signature = signPayload(encodedBody);
    return `${encodedBody}.${signature}`;
}

function decodeState(rawState) {
    if (!rawState) return { firebaseUid: null, redirectOrigin: null, valid: false };

    const asString = String(rawState);
    const [encodedBody, signature] = asString.split('.');
    if (!encodedBody || !signature) {
        // Backward compatibility fallback for legacy plain state values.
        return { firebaseUid: asString, redirectOrigin: null, valid: false, legacy: true };
    }

    const expected = signPayload(encodedBody);
    const signatureBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expected, 'utf8');
    const isSignatureValid = signatureBuffer.length === expectedBuffer.length
        && crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    if (!isSignatureValid) {
        return { firebaseUid: null, redirectOrigin: null, valid: false };
    }

    let parsed = null;
    try {
        parsed = JSON.parse(Buffer.from(encodedBody, 'base64url').toString('utf8'));
    } catch {
        return { firebaseUid: null, redirectOrigin: null, valid: false };
    }

    const iat = Number(parsed?.iat || 0);
    const expired = !iat || Date.now() - iat > DEFAULT_TTL_MS;

    return {
        firebaseUid: parsed?.firebaseUid || null,
        redirectOrigin: parsed?.redirectOrigin || null,
        valid: !expired,
        expired,
    };
}

module.exports = {
    encodeState,
    decodeState,
};

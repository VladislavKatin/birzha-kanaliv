const crypto = require('crypto');

const ENCRYPTED_PREFIX = 'enc:v1:';

function getEncryptionKey() {
    const raw = process.env.APP_ENCRYPTION_KEY || '';
    if (!raw) return null;

    // Support both raw 32-byte strings and 64-char hex keys.
    if (/^[0-9a-fA-F]{64}$/.test(raw)) {
        return Buffer.from(raw, 'hex');
    }

    if (raw.length === 32) {
        return Buffer.from(raw, 'utf8');
    }

    throw new Error('APP_ENCRYPTION_KEY must be 32 chars or 64-char hex');
}

function encryptToken(plainValue) {
    if (!plainValue) return plainValue;

    const key = getEncryptionKey();
    if (!key) return plainValue;

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(String(plainValue), 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    const payload = Buffer.concat([iv, tag, encrypted]).toString('base64url');
    return `${ENCRYPTED_PREFIX}${payload}`;
}

function decryptToken(storedValue) {
    if (!storedValue) return storedValue;

    if (!String(storedValue).startsWith(ENCRYPTED_PREFIX)) {
        // Backward compatibility for previously stored plain tokens.
        return storedValue;
    }

    const key = getEncryptionKey();
    if (!key) {
        throw new Error('Encrypted token exists but APP_ENCRYPTION_KEY is missing');
    }

    const encoded = String(storedValue).slice(ENCRYPTED_PREFIX.length);
    const payload = Buffer.from(encoded, 'base64url');
    const iv = payload.subarray(0, 12);
    const tag = payload.subarray(12, 28);
    const encrypted = payload.subarray(28);

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

module.exports = {
    encryptToken,
    decryptToken,
};

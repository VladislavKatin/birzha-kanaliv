function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function normalizeOptionalString(value) {
    if (value === undefined || value === null) return null;
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function isSafeInteger(value) {
    return Number.isInteger(value) && Number.isFinite(value);
}

function parseInteger(value, fallback = 0) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.trunc(parsed);
}

function isEnumValue(value, allowed) {
    return allowed.includes(value);
}

module.exports = {
    isNonEmptyString,
    normalizeOptionalString,
    isSafeInteger,
    parseInteger,
    isEnumValue,
};

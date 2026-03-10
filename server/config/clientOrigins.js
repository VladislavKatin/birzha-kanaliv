const DEFAULT_CLIENT_ORIGINS = [
    'https://birzha-kanaliv.biz.ua',
    'https://admin.birzha-kanaliv.biz.ua',
    'http://localhost:5173',
    'http://localhost:5174',
];

function normalizeOrigin(origin) {
    return String(origin || '').trim().replace(/\/+$/, '');
}

function getAllowedClientOrigins() {
    const fromEnv = `${process.env.CLIENT_URLS || ''},${process.env.CLIENT_URL || ''},${process.env.FRONTEND_URL || ''}`
        .split(',')
        .map(normalizeOrigin)
        .filter(Boolean);

    return [...new Set([...DEFAULT_CLIENT_ORIGINS.map(normalizeOrigin), ...fromEnv])];
}

function getDefaultClientUrl() {
    const fromEnv = process.env.CLIENT_URLS || process.env.CLIENT_URL || process.env.FRONTEND_URL;
    if (fromEnv) {
        const first = fromEnv.split(',').map((entry) => entry.trim()).find(Boolean);
        if (first) return first;
    }
    return 'https://birzha-kanaliv.biz.ua';
}

function resolveClientRedirectUrl(candidateOrigin) {
    const allowedOrigins = getAllowedClientOrigins();
    if (candidateOrigin && allowedOrigins.includes(candidateOrigin)) {
        return candidateOrigin;
    }
    return getDefaultClientUrl();
}

module.exports = {
    getAllowedClientOrigins,
    getDefaultClientUrl,
    resolveClientRedirectUrl,
    normalizeOrigin,
};

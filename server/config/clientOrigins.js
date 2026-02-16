const DEFAULT_CLIENT_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://birzha-kanaliv.biz.ua',
    'https://www.birzha-kanaliv.biz.ua',
    'https://admin.birzha-kanaliv.biz.ua',
];

function getAllowedClientOrigins() {
    const raw = process.env.CLIENT_URLS || process.env.CLIENT_URL || DEFAULT_CLIENT_ORIGINS.join(',');
    return raw
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
}

function getDefaultClientUrl() {
    const fromEnv = process.env.CLIENT_URLS || process.env.CLIENT_URL;
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
};

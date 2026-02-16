const NICHE_OPTIONS = [
    { value: 'tech', label: 'Технології' },
    { value: 'business', label: 'Бізнес' },
    { value: 'education', label: 'Освіта' },
    { value: 'gaming', label: 'Геймінг' },
    { value: 'travel', label: 'Подорожі' },
    { value: 'food', label: 'Кулінарія' },
    { value: 'lifestyle', label: 'Лайфстайл' },
    { value: 'music', label: 'Музика' },
    { value: 'health', label: 'Здоров’я' },
    { value: 'entertainment', label: 'Розваги' },
    { value: 'other', label: 'Інше' },
];

const LANGUAGE_OPTIONS = [
    { code: 'uk', name: 'Українська', flag: '🇺🇦' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'cs', name: 'Čeština', flag: '🇨🇿' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ru', name: 'ру', flag: '' },
];

export function getNicheOptions() {
    return NICHE_OPTIONS;
}

export function getLanguageOptions() {
    return LANGUAGE_OPTIONS;
}

export function getNicheLabel(value) {
    const key = String(value || '').trim().toLowerCase();
    if (!key) return '';
    const option = NICHE_OPTIONS.find((item) => item.value === key);
    return option ? option.label : value;
}

export function getLanguageLabel(value) {
    const key = String(value || '').trim().toLowerCase();
    if (!key) return '';
    const option = LANGUAGE_OPTIONS.find((item) => item.code === key);
    if (!option) return value;
    return option.flag ? `${option.flag} ${option.name}` : option.name;
}

export function getLanguageSearchValue(option) {
    if (!option) {
        return '';
    }

    const label = option.flag ? `${option.flag} ${option.name}` : option.name;
    return `${label} (${option.code})`;
}

export function resolveLanguageCode(rawLanguage) {
    const normalized = String(rawLanguage || '').trim().toLowerCase();
    if (!normalized) {
        return '';
    }

    const byCode = LANGUAGE_OPTIONS.find((option) => option.code === normalized);
    if (byCode) {
        return byCode.code;
    }

    const bySearchValue = LANGUAGE_OPTIONS.find((option) =>
        getLanguageSearchValue(option).toLowerCase() === normalized,
    );

    if (bySearchValue) {
        return bySearchValue.code;
    }

    const byName = LANGUAGE_OPTIONS.find((option) => option.name.toLowerCase() === normalized);
    return byName ? byName.code : '';
}

export function formatPublicNumber(value) {
    const num = Number(value || 0);
    if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K`;
    }
    return String(num);
}

export function getOfferTypeLabel(type) {
    return type === 'views' ? 'Перегляди' : 'Підписники';
}

export function normalizeOfferDescription(description, channelTitle = '') {
    const normalized = normalizeDisplayText(description, '');
    if (!normalized) return '';
    if (hasBrokenEncodingArtifacts(normalized)) {
        return `Автоматична пропозиція каналу ${normalizeDisplayText(channelTitle, 'без назви')}.`;
    }
    return normalized;
}

export function isDemoChannel(channel) {
    const channelId = channel?.channelId || '';
    return channelId.startsWith('UC_DEMO_');
}

export function uniqueOffersByChannel(offers = []) {
    const latestByChannel = new Map();

    offers.forEach((offer) => {
        const key = offer?.channel?.channelId || offer?.channel?.id || offer?.channelId;
        if (!key) {
            return;
        }

        const existing = latestByChannel.get(key);
        const existingCreatedAt = existing?.createdAt ? new Date(existing.createdAt).getTime() : 0;
        const currentCreatedAt = offer?.createdAt ? new Date(offer.createdAt).getTime() : 0;

        if (!existing || currentCreatedAt > existingCreatedAt) {
            latestByChannel.set(key, offer);
        }
    });

    return Array.from(latestByChannel.values());
}

function compareOffersByChannelStrength(a, b) {
    const subscribersA = Number(a?.channel?.subscribers || 0);
    const subscribersB = Number(b?.channel?.subscribers || 0);
    if (subscribersA !== subscribersB) {
        return subscribersB - subscribersA;
    }

    const createdAtA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const createdAtB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return createdAtB - createdAtA;
}

export function splitOffersByChannelKind(offers = []) {
    const uniqueOffers = uniqueOffersByChannel(offers);
    const realOffers = [];
    const demoOffers = [];

    uniqueOffers.forEach((offer) => {
        if (isDemoChannel(offer?.channel)) {
            demoOffers.push(offer);
            return;
        }
        realOffers.push(offer);
    });

    realOffers.sort(compareOffersByChannelStrength);
    demoOffers.sort(compareOffersByChannelStrength);

    return { realOffers, demoOffers };
}

export function prepareOffersForCatalog(offers = []) {
    const { realOffers, demoOffers } = splitOffersByChannelKind(offers);
    const withFlag = (offer, isDemo) => ({
        ...sanitizeOfferTextFields(offer),
        __isDemo: isDemo,
    });
    return [
        ...realOffers.map((offer) => withFlag(offer, false)),
        ...demoOffers.map((offer) => withFlag(offer, true)),
    ];
}

export function buildPublicOffersQuery(filter = {}) {
    const params = new URLSearchParams();
    const niche = filter.niche ? filter.niche.trim() : '';
    const language = resolveLanguageCode(filter.language);

    if (filter.type) {
        params.set('type', filter.type);
    }
    if (niche) {
        params.set('niche', niche);
    }
    if (language) {
        params.set('language', language);
    }

    const query = params.toString();
    return query ? `?${query}` : '';
}

export function buildOfferDetailsPath(offerId) {
    return `/offers/${offerId}`;
}

export function hasBrokenEncodingArtifacts(value) {
    const raw = String(value || '').trim();
    if (!raw) return false;

    return (
        /\uFFFD{2,}/u.test(raw) ||
        /^\?{3,}/.test(raw) ||
        /^(?:[^\p{L}\p{N}]{0,2}[\uFFFD?]){4,}$/u.test(raw) ||
        /(?:Ð|Ñ|Ã|Â|â€|â€”){2,}/u.test(raw)
    );
}

export function normalizeDisplayText(value, fallback = '') {
    const raw = String(value || '').trim();
    if (!raw || hasBrokenEncodingArtifacts(raw)) {
        return fallback;
    }
    return raw;
}

function sanitizeOfferTextFields(offer) {
    if (!offer || typeof offer !== 'object') {
        return offer;
    }

    return {
        ...offer,
        niche: normalizeDisplayText(offer.niche, ''),
        language: normalizeDisplayText(offer.language, ''),
        description: normalizeDisplayText(offer.description, ''),
        channel: offer.channel
            ? {
                ...offer.channel,
                channelTitle: normalizeDisplayText(offer.channel.channelTitle, 'Канал'),
                description: normalizeDisplayText(offer.channel.description, ''),
            }
            : offer.channel,
    };
}

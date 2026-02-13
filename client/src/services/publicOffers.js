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
    { value: 'other', label: 'Інше / Другое' },
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

export function isDemoChannel(channel) {
    const channelId = channel?.channelId || '';
    const channelTitle = channel?.channelTitle || '';
    return channelId.startsWith('UC_DEMO_') || channelTitle.includes('[DEMO]');
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

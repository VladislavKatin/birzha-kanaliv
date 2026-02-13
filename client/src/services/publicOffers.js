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

export function buildPublicOffersQuery(filter = {}) {
    const params = new URLSearchParams();
    const niche = filter.niche ? filter.niche.trim() : '';
    const language = filter.language ? filter.language.trim() : '';

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

import assert from 'node:assert/strict';
import {
    buildOfferDetailsPath,
    formatPublicNumber,
    getLanguageOptions,
    getLanguageSearchValue,
    getNicheOptions,
    getOfferTypeLabel,
    isDemoChannel,
    prepareOffersForCatalog,
    resolveLanguageCode,
    splitOffersByChannelKind,
    uniqueOffersByChannel,
} from './publicOffers.js';

export function runPublicOffersUnitTests() {
    assert.equal(formatPublicNumber(1530), '1.5K');
    assert.equal(formatPublicNumber(12), '12');
    assert.equal(getOfferTypeLabel('subs'), 'Підписники');
    assert.equal(getOfferTypeLabel('views'), 'Перегляди');
    assert.equal(buildOfferDetailsPath('abc-1'), '/offers/abc-1');

    assert.equal(isDemoChannel({ channelId: 'UC_DEMO_SAMPLE' }), true);
    assert.equal(isDemoChannel({ channelId: 'UC_REAL_SAMPLE', channelTitle: 'Real Channel' }), false);

    const split = splitOffersByChannelKind([
        { id: 'demo-1', channel: { channelId: 'UC_DEMO_SAMPLE', subscribers: 999999 }, createdAt: '2026-02-10T10:00:00.000Z' },
        { id: 'real-1', channel: { channelId: 'UC_REAL_1', subscribers: 1000 }, createdAt: '2026-02-11T10:00:00.000Z' },
        { id: 'real-2', channel: { channelId: 'UC_REAL_2', subscribers: 2000 }, createdAt: '2026-02-12T10:00:00.000Z' },
    ]);
    assert.equal(split.realOffers.length, 2);
    assert.equal(split.demoOffers.length, 1);
    assert.equal(split.realOffers[0].id, 'real-2');
    assert.equal(split.demoOffers[0].id, 'demo-1');

    const unique = uniqueOffersByChannel([
        { id: 'old', channel: { channelId: 'UC_REAL_DUP' }, createdAt: '2026-02-10T10:00:00.000Z' },
        { id: 'new', channel: { channelId: 'UC_REAL_DUP' }, createdAt: '2026-02-12T10:00:00.000Z' },
        { id: 'another', channel: { channelId: 'UC_REAL_OTHER' }, createdAt: '2026-02-11T10:00:00.000Z' },
    ]);
    assert.equal(unique.length, 2);
    assert.equal(unique.some((offer) => offer.id === 'new'), true);
    assert.equal(unique.some((offer) => offer.id === 'old'), false);
    const orderedCatalog = prepareOffersForCatalog([
        { id: 'demo-a', channel: { channelId: 'UC_DEMO_001', subscribers: 9999 }, createdAt: '2026-02-10T10:00:00.000Z' },
        { id: 'real-old', channel: { channelId: 'UC_REAL_001', subscribers: 1200 }, createdAt: '2026-02-10T10:00:00.000Z' },
        { id: 'real-new', channel: { channelId: 'UC_REAL_001', subscribers: 1200 }, createdAt: '2026-02-12T10:00:00.000Z' },
        { id: 'real-top', channel: { channelId: 'UC_REAL_002', subscribers: 3200 }, createdAt: '2026-02-11T10:00:00.000Z' },
    ]);
    assert.equal(orderedCatalog.length, 3);
    assert.equal(orderedCatalog[0].id, 'real-top');
    assert.equal(orderedCatalog[0].__isDemo, false);
    assert.equal(orderedCatalog[1].id, 'real-new');
    assert.equal(orderedCatalog[2].id, 'demo-a');
    assert.equal(orderedCatalog[2].__isDemo, true);

    const niches = getNicheOptions();
    assert.equal(niches.some((niche) => niche.value === 'other'), true);

    const languages = getLanguageOptions();
    assert.equal(languages[languages.length - 1].code, 'ru');
    assert.equal(languages[languages.length - 1].flag, '');

    assert.equal(resolveLanguageCode('uk'), 'uk');
    assert.equal(resolveLanguageCode(getLanguageSearchValue(languages[0])), 'uk');
}

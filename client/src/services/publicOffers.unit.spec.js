import assert from 'node:assert/strict';
import {
    buildOfferDetailsPath,
    formatPublicNumber,
    getLanguageOptions,
    getLanguageSearchValue,
    getNicheOptions,
    getOfferTypeLabel,
    isDemoChannel,
    resolveLanguageCode,
    splitOffersByChannelKind,
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

    const niches = getNicheOptions();
    assert.equal(niches.some((niche) => niche.value === 'other'), true);

    const languages = getLanguageOptions();
    assert.equal(languages[languages.length - 1].code, 'ru');
    assert.equal(languages[languages.length - 1].flag, '');

    assert.equal(resolveLanguageCode('uk'), 'uk');
    assert.equal(resolveLanguageCode(getLanguageSearchValue(languages[0])), 'uk');
}

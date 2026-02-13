import assert from 'node:assert/strict';
import {
    buildOfferDetailsPath,
    formatPublicNumber,
    getOfferTypeLabel,
} from './publicOffers.js';

export function runPublicOffersUnitTests() {
    assert.equal(formatPublicNumber(1530), '1.5K');
    assert.equal(formatPublicNumber(12), '12');
    assert.equal(getOfferTypeLabel('subs'), 'Підписники');
    assert.equal(getOfferTypeLabel('views'), 'Перегляди');
    assert.equal(buildOfferDetailsPath('abc-1'), '/offers/abc-1');
}

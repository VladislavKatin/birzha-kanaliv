import assert from 'node:assert/strict';
import { buildPublicOffersQuery } from './publicOffers.js';

export function runPublicOffersFunctionalTests() {
    assert.equal(
        buildPublicOffersQuery({ type: 'subs', niche: 'gaming', language: 'uk' }),
        '?type=subs&niche=gaming&language=uk',
    );

    assert.equal(
        buildPublicOffersQuery({ type: '', niche: '  ', language: '' }),
        '',
    );
}

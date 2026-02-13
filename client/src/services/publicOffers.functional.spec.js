import assert from 'node:assert/strict';
import { buildPublicOffersQuery, getLanguageSearchValue, getLanguageOptions } from './publicOffers.js';

export function runPublicOffersFunctionalTests() {
    const languages = getLanguageOptions();

    assert.equal(
        buildPublicOffersQuery({ type: 'subs', niche: 'gaming', language: getLanguageSearchValue(languages[0]) }),
        '?type=subs&niche=gaming&language=uk',
    );

    assert.equal(
        buildPublicOffersQuery({ type: '', niche: '  ', language: '' }),
        '',
    );

    assert.equal(
        buildPublicOffersQuery({ type: '', niche: 'business', language: 'ru' }),
        '?niche=business&language=ru',
    );
}

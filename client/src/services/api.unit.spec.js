import assert from 'node:assert/strict';

import { normalizeApiBaseUrl } from './apiBaseUrl.js';

export function runApiUnitTests() {
    assert.equal(
        normalizeApiBaseUrl('https://api.birzha-kanaliv.biz.ua'),
        'https://api.birzha-kanaliv.biz.ua/api'
    );

    assert.equal(
        normalizeApiBaseUrl('https://api.birzha-kanaliv.biz.ua/api'),
        'https://api.birzha-kanaliv.biz.ua/api'
    );

    assert.equal(
        normalizeApiBaseUrl('https://api.birzha-kanaliv.biz.ua/api/'),
        'https://api.birzha-kanaliv.biz.ua/api'
    );

    assert.equal(
        normalizeApiBaseUrl('/api', 'https://birzha-kanaliv.biz.ua/api', 'https://birzha-kanaliv.biz.ua'),
        'https://birzha-kanaliv.biz.ua/api'
    );
}

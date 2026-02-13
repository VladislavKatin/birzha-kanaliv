import assert from 'node:assert/strict';
import { buildNotificationKey, formatToastMessage } from './globalNotifications.js';

export function runGlobalNotificationFunctionalTests() {
    const first = {
        type: 'match',
        title: 'Partner confirmed',
        message: 'Please confirm too',
        createdAt: '2026-02-13T12:00:00.000Z',
    };

    const second = {
        type: 'match',
        title: 'Partner confirmed',
        message: 'Please confirm too',
        createdAt: '2026-02-13T12:00:01.000Z',
    };

    const key1 = buildNotificationKey(first, 0);
    const key2 = buildNotificationKey(second, 0);

    assert.notEqual(key1, key2);
    assert.equal(formatToastMessage({ title: '', message: 'Only message' }), 'Only message');
    assert.equal(formatToastMessage({ title: 'Only title', message: '' }), 'Only title');
}

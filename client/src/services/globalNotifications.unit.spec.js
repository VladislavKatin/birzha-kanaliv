import assert from 'node:assert/strict';
import { normalizeNotification, buildNotificationKey, formatToastMessage } from './globalNotifications.js';

export function runGlobalNotificationUnitTests() {
    assert.equal(normalizeNotification(null), null);

    const normalized = normalizeNotification({
        id: 'n1',
        type: 'swap_accepted',
        title: ' Accepted ',
        message: ' Done ',
        link: '/swaps',
    });

    assert.deepEqual(normalized, {
        id: 'n1',
        type: 'swap_accepted',
        title: 'Accepted',
        message: 'Done',
        link: '/swaps',
        createdAt: null,
    });

    assert.equal(buildNotificationKey({ id: 'n1', title: 'a' }), 'id:n1');
    assert.equal(formatToastMessage({ title: 'A', message: 'B' }), 'A: B');
}

import assert from 'node:assert/strict';
import { formatAdminDate, normalizeAdminOverview } from './adminCenter.js';

export function runAdminCenterUnitTests() {
    const normalized = normalizeAdminOverview({
        summary: { totalUsers: '3' },
        distributions: { offersByStatus: [{ status: 'open', count: 2 }] },
        recent: { users: [{ id: 'u1' }] },
    });

    assert.equal(normalized.summary.totalUsers, 3);
    assert.equal(normalized.summary.totalChannels, 0);
    assert.equal(Array.isArray(normalized.distributions.offersByStatus), true);
    assert.equal(normalized.recent.users.length, 1);

    assert.equal(formatAdminDate(null), '-');
    assert.equal(typeof formatAdminDate('2026-02-13T10:00:00.000Z'), 'string');
}

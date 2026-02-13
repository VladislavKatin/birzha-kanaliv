import assert from 'node:assert/strict';
import { normalizeAdminOverview, normalizeAdminUsers } from './adminCenter.js';

export function runAdminCenterFunctionalTests() {
    const payload = normalizeAdminOverview({});

    assert.equal(payload.summary.totalUsers, 0);
    assert.equal(payload.summary.matchesCompleted7d, 0);
    assert.equal(Array.isArray(payload.distributions.matchesByStatus), true);
    assert.equal(Array.isArray(payload.recent.messages), true);

    const usersPayload = normalizeAdminUsers({});
    assert.equal(usersPayload.page, 1);
    assert.equal(Array.isArray(usersPayload.users), true);
}

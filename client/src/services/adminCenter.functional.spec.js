import assert from 'node:assert/strict';
import { normalizeAdminOverview } from './adminCenter.js';

export function runAdminCenterFunctionalTests() {
    const payload = normalizeAdminOverview({});

    assert.equal(payload.summary.totalUsers, 0);
    assert.equal(payload.summary.matchesCompleted7d, 0);
    assert.equal(Array.isArray(payload.distributions.matchesByStatus), true);
    assert.equal(Array.isArray(payload.recent.messages), true);
}

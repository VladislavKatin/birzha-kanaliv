import assert from 'node:assert/strict';
import { getLandingMetricsSummary, isLandingReadyForRender } from './homeLanding.js';

export function runHomeLandingFunctionalTests() {
    const summary = getLandingMetricsSummary({
        stats: [{}],
        steps: [{}, {}, {}],
        features: [{}, {}],
        faq: [{}],
    });

    assert.equal(summary.stepCount, 3);
    assert.equal(isLandingReadyForRender({
        stats: [{}],
        steps: [{}, {}, {}],
        features: [{}, {}],
        faq: [{}],
    }), true);

    assert.equal(isLandingReadyForRender({
        stats: [],
        steps: [{}],
        features: [{}],
        faq: [{}],
    }), false);
}

import assert from 'node:assert/strict';
import { getLandingCtaPaths, getLandingMetricsSummary } from './homeLanding.js';

export function runHomeLandingUnitTests() {
    const paths = getLandingCtaPaths();

    assert.equal(paths.authPath, '/auth');
    assert.equal(paths.offersPath, '/auth?next=%2Foffers');

    assert.deepEqual(
        getLandingMetricsSummary({
            stats: [1, 2],
            steps: [1],
            features: [1, 2, 3],
            faq: [1, 2],
        }),
        {
            statCount: 2,
            stepCount: 1,
            featureCount: 3,
            faqCount: 2,
        },
    );
}

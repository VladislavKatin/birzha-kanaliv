import assert from 'node:assert/strict';
import { getLandingCtaPaths, getLandingMetricsSummary, getLandingNavLinks } from './homeLanding.js';

export function runHomeLandingUnitTests() {
    const paths = getLandingCtaPaths();

    assert.equal(paths.authPath, '/auth');
    assert.equal(paths.offersPath, '/offers');

    const navLinks = getLandingNavLinks();
    assert.equal(navLinks.length, 5);
    assert.equal(navLinks[0].href, '/#how-it-works');

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

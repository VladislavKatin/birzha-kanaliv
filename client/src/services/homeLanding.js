import { buildAuthRedirectPath } from './navigation.js';

export function getLandingCtaPaths() {
    return {
        authPath: '/auth',
        offersPath: buildAuthRedirectPath('/offers'),
    };
}

export function getLandingMetricsSummary(content) {
    const data = content || {};

    return {
        statCount: Array.isArray(data.stats) ? data.stats.length : 0,
        stepCount: Array.isArray(data.steps) ? data.steps.length : 0,
        featureCount: Array.isArray(data.features) ? data.features.length : 0,
        faqCount: Array.isArray(data.faq) ? data.faq.length : 0,
    };
}

export function isLandingReadyForRender(content) {
    const summary = getLandingMetricsSummary(content);

    return summary.statCount > 0
        && summary.stepCount > 0
        && summary.featureCount > 0
        && summary.faqCount > 0;
}

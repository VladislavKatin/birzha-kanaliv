export function getLandingCtaPaths() {
    return {
        authPath: '/auth',
        offersPath: '/offers',
    };
}

export function getLandingNavLinks() {
    return [
        { label: 'Як це працює', href: '/#how-it-works' },
        { label: 'Кому підходить', href: '/#who-is-for' },
        { label: 'Переваги', href: '/#advantages' },
        { label: 'Блог', href: '/#blog' },
        { label: 'FAQ', href: '/#faq' },
    ];
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

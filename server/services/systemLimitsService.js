const DEFAULT_LIMITS = {
    offersPerWeek: 5,
    activeExchangesPerChannel: 3,
};

function normalizeIncomingLimits(raw = {}) {
    const offersPerWeek = Number(raw.offersPerWeek);
    const activeExchangesPerChannel = Number(raw.activeExchangesPerChannel);

    return {
        offersPerWeek: Number.isFinite(offersPerWeek) ? offersPerWeek : DEFAULT_LIMITS.offersPerWeek,
        activeExchangesPerChannel: Number.isFinite(activeExchangesPerChannel)
            ? activeExchangesPerChannel
            : DEFAULT_LIMITS.activeExchangesPerChannel,
    };
}

function validateLimits(limits) {
    const errors = [];

    if (!Number.isInteger(limits.offersPerWeek) || limits.offersPerWeek < 1 || limits.offersPerWeek > 100) {
        errors.push('offersPerWeek must be an integer between 1 and 100');
    }

    if (!Number.isInteger(limits.activeExchangesPerChannel) || limits.activeExchangesPerChannel < 1 || limits.activeExchangesPerChannel > 100) {
        errors.push('activeExchangesPerChannel must be an integer between 1 and 100');
    }

    return errors;
}

async function getSystemLimits({ ActionLog, transaction }) {
    const latest = await ActionLog.findOne({
        where: { action: 'admin_system_limits_updated' },
        attributes: ['id', 'details', 'createdAt'],
        order: [['createdAt', 'DESC']],
        transaction,
    });

    const stored = normalizeIncomingLimits(latest?.details?.limits || {});

    return {
        limits: {
            offersPerWeek: stored.offersPerWeek,
            activeExchangesPerChannel: stored.activeExchangesPerChannel,
        },
        source: latest ? 'action_log' : 'defaults',
        updatedAt: latest?.createdAt || null,
    };
}

module.exports = {
    DEFAULT_LIMITS,
    getSystemLimits,
    normalizeIncomingLimits,
    validateLimits,
};

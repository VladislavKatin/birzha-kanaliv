function determineConfirmationPatch(isInitiator) {
    return isInitiator
        ? { initiatorConfirmed: true }
        : { targetConfirmed: true };
}

async function completeMatchInTransaction({
    match,
    isInitiator,
    actorUserId,
    ip,
    sequelize,
    TrafficOffer,
    ActionLog,
    now = () => new Date(),
}) {
    const transaction = await sequelize.transaction();

    try {
        if (match.status !== 'accepted') {
            const error = new Error('MATCH_NOT_ACCEPTED');
            error.code = 'MATCH_NOT_ACCEPTED';
            throw error;
        }

        await match.update(determineConfirmationPatch(isInitiator), { transaction });
        await match.reload({ transaction });

        if (match.initiatorConfirmed && match.targetConfirmed) {
            await match.update({ status: 'completed', completedAt: now() }, { transaction });

            const offer = await TrafficOffer.findByPk(match.offerId, { transaction });
            if (offer) {
                await offer.update({ status: 'completed' }, { transaction });
            }
        }

        await ActionLog.create({
            userId: actorUserId,
            action: 'swap_completion_confirmed',
            details: {
                matchId: match.id,
                isInitiator,
                status: match.status,
            },
            ip,
        }, { transaction });

        await transaction.commit();

        return match;
    } catch (error) {
        await transaction.rollback();

        try {
            await ActionLog.create({
                userId: actorUserId,
                action: 'swap_completion_failed',
                details: {
                    matchId: match?.id || null,
                    reason: error.message,
                },
                ip,
            });
        } catch (auditError) {
            console.error('Audit log write failed after rollback:', auditError);
        }

        throw error;
    }
}

module.exports = {
    determineConfirmationPatch,
    completeMatchInTransaction,
};

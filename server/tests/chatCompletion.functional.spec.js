const assert = require('node:assert/strict');
const { completeMatchInTransaction } = require('../services/chatCompletionService');

function createFakeTransaction() {
    return {
        committed: false,
        rolledBack: false,
        async commit() {
            this.committed = true;
        },
        async rollback() {
            this.rolledBack = true;
        },
    };
}

async function runChatCompletionFunctionalTests() {
    await testCompletesMatchAndOfferWhenBothConfirmed();
    await testRollsBackAndWritesFailureAuditOnError();
}

async function testCompletesMatchAndOfferWhenBothConfirmed() {
    const tx = createFakeTransaction();
    const calls = {
        actionLogCreate: 0,
    };

    const match = {
        id: 'match-1',
        offerId: 'offer-1',
        status: 'accepted',
        initiatorConfirmed: true,
        targetConfirmed: false,
        async update(values) {
            Object.assign(this, values);
        },
        async reload() {},
    };

    const sequelize = {
        async transaction() {
            return tx;
        },
    };

    const ActionLog = {
        async create(payload) {
            calls.actionLogCreate += 1;
            assert.equal(payload.action, 'swap_completion_confirmed');
            return payload;
        },
    };

    await completeMatchInTransaction({
        match,
        isInitiator: false,
        actorUserId: 'user-1',
        ip: '127.0.0.1',
        sequelize,
        ActionLog,
        now: () => new Date('2026-02-13T12:00:00.000Z'),
    });

    assert.equal(match.status, 'completed');
    assert.equal(match.targetConfirmed, true);
    assert.equal(tx.committed, true);
    assert.equal(tx.rolledBack, false);
    assert.equal(calls.actionLogCreate, 1);
}

async function testRollsBackAndWritesFailureAuditOnError() {
    const tx = createFakeTransaction();
    const auditActions = [];

    const match = {
        id: 'match-2',
        offerId: 'offer-2',
        status: 'accepted',
        initiatorConfirmed: false,
        targetConfirmed: false,
        async update() {
            throw new Error('DB_WRITE_FAILED');
        },
        async reload() {},
    };

    const sequelize = {
        async transaction() {
            return tx;
        },
    };

    const ActionLog = {
        async create(payload) {
            auditActions.push(payload.action);
            return payload;
        },
    };

    await assert.rejects(async () => {
        await completeMatchInTransaction({
            match,
            isInitiator: true,
            actorUserId: 'user-2',
            ip: '127.0.0.1',
            sequelize,
            ActionLog,
        });
    }, /DB_WRITE_FAILED/);

    assert.equal(tx.committed, false);
    assert.equal(tx.rolledBack, true);
    assert.deepEqual(auditActions, ['swap_completion_failed']);
}

module.exports = {
    runChatCompletionFunctionalTests,
};

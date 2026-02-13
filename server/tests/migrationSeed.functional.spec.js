const assert = require('node:assert/strict');

const migration = require('../migrations/20260213170000-initial-schema');
const seeder = require('../seeders/20260213171000-initial-dev-seed');

function createMockQueryInterface() {
    const calls = {
        createTable: [],
        addIndex: [],
        dropTable: [],
        rawQueries: [],
        bulkInsert: [],
        bulkDelete: [],
        transactionCount: 0,
    };

    const tx = { id: 'tx-1' };

    const queryInterface = {
        sequelize: {
            async transaction(callback) {
                calls.transactionCount += 1;
                return callback(tx);
            },
            async query(sql) {
                calls.rawQueries.push(sql);
            },
        },
        async createTable(name) {
            calls.createTable.push(name);
        },
        async addIndex(name, columns) {
            calls.addIndex.push({ name, columns });
        },
        async dropTable(name) {
            calls.dropTable.push(name);
        },
        async bulkInsert(name) {
            calls.bulkInsert.push(name);
        },
        async bulkDelete(name) {
            calls.bulkDelete.push(name);
        },
    };

    return { queryInterface, calls };
}

async function runMigrationSeedFunctionalTests() {
    await testMigrationUpUsesTransactionAndCreatesCoreTables();
    await testSeederUpUsesTransactionAndInsertsAuditLog();
}

async function testMigrationUpUsesTransactionAndCreatesCoreTables() {
    const { queryInterface, calls } = createMockQueryInterface();

    await migration.up(queryInterface, {
        UUID: 'UUID',
        STRING: (length) => ({ type: 'STRING', length }),
        TEXT: 'TEXT',
        INTEGER: 'INTEGER',
        JSONB: 'JSONB',
        BOOLEAN: 'BOOLEAN',
        DATE: 'DATE',
        FLOAT: 'FLOAT',
        BIGINT: 'BIGINT',
        literal: (value) => ({ type: 'LITERAL', value }),
        ENUM: (...values) => ({ type: 'ENUM', values }),
    });

    assert.equal(calls.transactionCount, 1);
    assert.ok(calls.createTable.includes('users'));
    assert.ok(calls.createTable.includes('action_logs'));
    assert.ok(calls.addIndex.length > 0);
}

async function testSeederUpUsesTransactionAndInsertsAuditLog() {
    const { queryInterface, calls } = createMockQueryInterface();

    await seeder.up(queryInterface);

    assert.equal(calls.transactionCount, 1);
    assert.ok(calls.bulkInsert.includes('users'));
    assert.ok(calls.bulkInsert.includes('action_logs'));
}

module.exports = {
    runMigrationSeedFunctionalTests,
};

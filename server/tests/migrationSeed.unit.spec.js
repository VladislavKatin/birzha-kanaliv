const assert = require('node:assert/strict');

const migration = require('../migrations/20260213170000-initial-schema');
const seeder = require('../seeders/20260213171000-initial-dev-seed');

function runMigrationSeedUnitTests() {
    assert.equal(typeof migration.up, 'function');
    assert.equal(typeof migration.down, 'function');
    assert.equal(typeof seeder.up, 'function');
    assert.equal(typeof seeder.down, 'function');
}

module.exports = {
    runMigrationSeedUnitTests,
};

const { runChatCompletionUnitTests } = require('./chatCompletion.unit.spec');
const { runChatCompletionFunctionalTests } = require('./chatCompletion.functional.spec');
const { runMigrationSeedUnitTests } = require('./migrationSeed.unit.spec');
const { runMigrationSeedFunctionalTests } = require('./migrationSeed.functional.spec');

async function run() {
    const tests = [
        { name: 'unit: determineConfirmationPatch', fn: runChatCompletionUnitTests },
        { name: 'functional: completeMatchInTransaction', fn: runChatCompletionFunctionalTests },
        { name: 'unit: migration and seed exports', fn: runMigrationSeedUnitTests },
        { name: 'functional: migration and seed transaction flow', fn: runMigrationSeedFunctionalTests },
    ];

    let failed = 0;

    for (const test of tests) {
        try {
            await test.fn();
            console.log(`PASS ${test.name}`);
        } catch (error) {
            failed += 1;
            console.error(`FAIL ${test.name}`);
            console.error(error);
        }
    }

    if (failed > 0) {
        process.exitCode = 1;
        return;
    }

    console.log('All server tests passed');
}

run();

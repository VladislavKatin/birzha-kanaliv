const { runChatCompletionUnitTests } = require('./chatCompletion.unit.spec');
const { runChatCompletionFunctionalTests } = require('./chatCompletion.functional.spec');
const { runMigrationSeedUnitTests } = require('./migrationSeed.unit.spec');
const { runMigrationSeedFunctionalTests } = require('./migrationSeed.functional.spec');
const { runReviewReadUnitTests } = require('./reviewRead.unit.spec');
const { runReviewReadFunctionalTests } = require('./reviewRead.functional.spec');
const { runChannelAccessUnitTests } = require('./channelAccess.unit.spec');
const { runChannelAccessFunctionalTests } = require('./channelAccess.functional.spec');
const { runLoggerUnitTests } = require('./logger.unit.spec');
const { runLoggerFunctionalTests } = require('./logger.functional.spec');
const { runApiSmokeUnitTests } = require('./apiSmoke.unit.spec');
const { runApiSmokeFunctionalTests } = require('./apiSmoke.functional.spec');
const { runAdminOverviewUnitTests } = require('./adminOverview.unit.spec');
const { runAdminOverviewFunctionalTests } = require('./adminOverview.functional.spec');
const { runAdminUsersUnitTests } = require('./adminUsers.unit.spec');
const { runAdminUsersFunctionalTests } = require('./adminUsers.functional.spec');
const { runChatMessagePayloadUnitTests } = require('./chatMessagePayload.unit.spec');

async function run() {
    const tests = [
        { name: 'unit: determineConfirmationPatch', fn: runChatCompletionUnitTests },
        { name: 'functional: completeMatchInTransaction', fn: runChatCompletionFunctionalTests },
        { name: 'unit: migration and seed exports', fn: runMigrationSeedUnitTests },
        { name: 'functional: migration and seed transaction flow', fn: runMigrationSeedFunctionalTests },
        { name: 'unit: review read rating summary', fn: runReviewReadUnitTests },
        { name: 'functional: published reviews query contract', fn: runReviewReadFunctionalTests },
        { name: 'unit: channel selection rules', fn: runChannelAccessUnitTests },
        { name: 'functional: user channel lookup', fn: runChannelAccessFunctionalTests },
        { name: 'unit: structured logger payload', fn: runLoggerUnitTests },
        { name: 'functional: structured logger output', fn: runLoggerFunctionalTests },
        { name: 'unit: api smoke endpoint manifest', fn: runApiSmokeUnitTests },
        { name: 'functional: api smoke core flow', fn: runApiSmokeFunctionalTests },
        { name: 'unit: admin overview payload contract', fn: runAdminOverviewUnitTests },
        { name: 'functional: admin overview access and data', fn: runAdminOverviewFunctionalTests },
        { name: 'unit: admin users endpoint manifest', fn: runAdminUsersUnitTests },
        { name: 'functional: admin users manage flow', fn: runAdminUsersFunctionalTests },
        { name: 'unit: chat message payload parser', fn: runChatMessagePayloadUnitTests },
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

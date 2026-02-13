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
const { runSupportChatUnitTests } = require('./supportChat.unit.spec');
const { runSupportChatFunctionalTests } = require('./supportChat.functional.spec');
const { runAdminModerationUnitTests } = require('./adminModeration.unit.spec');
const { runAdminModerationFunctionalTests } = require('./adminModeration.functional.spec');
const { runAdminHistoryUnitTests } = require('./adminHistory.unit.spec');
const { runAdminHistoryFunctionalTests } = require('./adminHistory.functional.spec');
const { runAdminSupportUnitTests } = require('./adminSupport.unit.spec');
const { runAdminSupportFunctionalTests } = require('./adminSupport.functional.spec');
const { runAdminSystemUnitTests } = require('./adminSystem.unit.spec');
const { runAdminSystemFunctionalTests } = require('./adminSystem.functional.spec');

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
        { name: 'unit: support chat endpoint manifest', fn: runSupportChatUnitTests },
        { name: 'functional: support chat message flow', fn: runSupportChatFunctionalTests },
        { name: 'unit: admin moderation endpoint manifest', fn: runAdminModerationUnitTests },
        { name: 'functional: admin moderation flow', fn: runAdminModerationFunctionalTests },
        { name: 'unit: admin exchange history endpoint manifest', fn: runAdminHistoryUnitTests },
        { name: 'functional: admin exchange history flow', fn: runAdminHistoryFunctionalTests },
        { name: 'unit: admin support endpoint manifest', fn: runAdminSupportUnitTests },
        { name: 'functional: admin support inbox flow', fn: runAdminSupportFunctionalTests },
        { name: 'unit: admin system endpoint manifest', fn: runAdminSystemUnitTests },
        { name: 'functional: admin system insights flow', fn: runAdminSystemFunctionalTests },
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

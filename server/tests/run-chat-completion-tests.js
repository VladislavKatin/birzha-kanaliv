const { runChatCompletionUnitTests } = require('./chatCompletion.unit.spec');
const { runChatCompletionFunctionalTests } = require('./chatCompletion.functional.spec');

async function run() {
    const tests = [
        { name: 'unit: determineConfirmationPatch', fn: runChatCompletionUnitTests },
        { name: 'functional: completeMatchInTransaction', fn: runChatCompletionFunctionalTests },
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

    console.log('All chat completion tests passed');
}

run();

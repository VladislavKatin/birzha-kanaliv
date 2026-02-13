import { runSocketUnitTests } from './socket.unit.spec.js';
import { runSocketFunctionalTests } from './socket.functional.spec.js';

async function run() {
    const tests = [
        { name: 'unit: resolveSocketUrl', fn: runSocketUnitTests },
        { name: 'functional: createAuthenticatedSocket', fn: runSocketFunctionalTests },
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
        if (globalThis.process) {
            globalThis.process.exitCode = 1;
        }
        return;
    }

    console.log('All socket tests passed');
}

run();

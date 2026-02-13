import { runSocketUnitTests } from './socket.unit.spec.js';
import { runSocketFunctionalTests } from './socket.functional.spec.js';
import { runNavigationUnitTests } from './navigation.unit.spec.js';
import { runNavigationFunctionalTests } from './navigation.functional.spec.js';
import { runGlobalNotificationUnitTests } from './globalNotifications.unit.spec.js';
import { runGlobalNotificationFunctionalTests } from './globalNotifications.functional.spec.js';
import { runPwaManifestUnitTests } from './pwaManifest.unit.spec.js';
import { runPwaManifestFunctionalTests } from './pwaManifest.functional.spec.js';
import { runHomeLandingUnitTests } from './homeLanding.unit.spec.js';
import { runHomeLandingFunctionalTests } from './homeLanding.functional.spec.js';

async function run() {
    const tests = [
        { name: 'unit: resolveSocketUrl', fn: runSocketUnitTests },
        { name: 'functional: createAuthenticatedSocket', fn: runSocketFunctionalTests },
        { name: 'unit: navigation redirect helpers', fn: runNavigationUnitTests },
        { name: 'functional: post-auth navigation safety', fn: runNavigationFunctionalTests },
        { name: 'unit: global notification normalization', fn: runGlobalNotificationUnitTests },
        { name: 'functional: global notification key strategy', fn: runGlobalNotificationFunctionalTests },
        { name: 'unit: pwa manifest icon path collection', fn: runPwaManifestUnitTests },
        { name: 'functional: pwa manifest icon files exist', fn: runPwaManifestFunctionalTests },
        { name: 'unit: home landing cta and metrics', fn: runHomeLandingUnitTests },
        { name: 'functional: home landing readiness rules', fn: runHomeLandingFunctionalTests },
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

    console.log('All client tests passed');
}

run();

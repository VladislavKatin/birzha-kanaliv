import assert from 'node:assert/strict';
import { collectManifestIconPaths } from './pwaManifest.js';

export function runPwaManifestUnitTests() {
    const paths = collectManifestIconPaths({
        icons: [
            { src: '/icons/icon-192.png' },
            { src: '/icons/icon-512.png' },
            { src: 'https://example.com/icon.png' },
            { src: null },
        ],
    });

    assert.deepEqual(paths, ['/icons/icon-192.png', '/icons/icon-512.png']);
}

import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { collectManifestIconPaths, parseManifest } from './pwaManifest.js';

export function runPwaManifestFunctionalTests() {
    const cwd = globalThis.process?.cwd ? globalThis.process.cwd() : '.';
    const manifestPath = join(cwd, 'public', 'manifest.json');
    const raw = readFileSync(manifestPath, 'utf8');
    const manifest = parseManifest(raw);

    const iconPaths = collectManifestIconPaths(manifest);
    assert.equal(iconPaths.length > 0, true);

    iconPaths.forEach((src) => {
        const localPath = join(cwd, 'public', src.replace(/^\//, ''));
        assert.equal(existsSync(localPath), true, `Missing icon file for ${src}`);
    });
}

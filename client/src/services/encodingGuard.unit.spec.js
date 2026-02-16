import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_ROOT = path.resolve(CURRENT_DIR, '..');
const TARGET_EXTENSIONS = new Set(['.js', '.jsx', '.css', '.html']);

function collectSourceFiles(dir, result = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            collectSourceFiles(fullPath, result);
            continue;
        }
        if (TARGET_EXTENSIONS.has(path.extname(entry.name))) {
            result.push(fullPath);
        }
    }
    return result;
}

function findBrokenEncodingLine(content) {
    const lines = content.split(/\r?\n/);
    const replacementChar = '\uFFFD';

    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        if (line.includes(replacementChar)) {
            return index + 1;
        }
    }

    return 0;
}

export function runEncodingGuardUnitTests() {
    const files = collectSourceFiles(SOURCE_ROOT);
    const offenders = [];

    files.forEach((filePath) => {
        const content = fs.readFileSync(filePath, 'utf8');
        const line = findBrokenEncodingLine(content);
        if (!line) return;
        offenders.push(`${path.relative(SOURCE_ROOT, filePath)}:${line}`);
    });

    assert.equal(
        offenders.length,
        0,
        `Encoding guard failed. Broken replacement characters found in: ${offenders.join(', ')}`,
    );
}

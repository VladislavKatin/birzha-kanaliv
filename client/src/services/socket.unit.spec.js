import assert from 'node:assert/strict';

import { resolveSocketUrl } from './socket.js';

export function runSocketUnitTests() {
    const explicitSocketUrl = resolveSocketUrl({
        VITE_SOCKET_URL: 'https://ws.example.com/',
        VITE_API_URL: 'https://api.example.com/api',
    });
    assert.equal(explicitSocketUrl, 'https://ws.example.com');

    const fromApiUrl = resolveSocketUrl({
        VITE_API_URL: 'https://api.example.com/api/v1',
    });
    assert.equal(fromApiUrl, 'https://api.example.com');

    const fallback = resolveSocketUrl({});
    assert.equal(fallback, 'http://localhost:3001');
}

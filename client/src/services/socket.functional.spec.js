import assert from 'node:assert/strict';

import { createAuthenticatedSocket } from './socket.js';

export async function runSocketFunctionalTests() {
    const calls = [];
    const fakeSocket = { id: 'socket-1' };

    const ioClient = (url, options) => {
        calls.push({ url, options });
        return fakeSocket;
    };

    const getToken = async () => 'token-123';

    const result = await createAuthenticatedSocket(getToken, {
        ioClient,
        socketUrl: 'http://localhost:3001',
    });

    assert.equal(result, fakeSocket);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'http://localhost:3001');
    assert.deepEqual(calls[0].options, {
        auth: { token: 'token-123' },
        transports: ['websocket', 'polling'],
    });
}

import assert from 'node:assert/strict';
import {
    computeMenuBadgeCounts,
    getPendingSwapsCount,
    getSupportLastMessage,
    getThreadSeenKey,
    isThreadUnread,
} from './menuBadges.js';

function createStorage(initial = {}) {
    const memory = new Map(Object.entries(initial));
    return {
        getItem(key) {
            return memory.has(key) ? memory.get(key) : null;
        },
        setItem(key, value) {
            memory.set(key, String(value));
        },
    };
}

export function runMenuBadgesUnitTests() {
    assert.equal(getPendingSwapsCount([]), 0);
    assert.equal(getPendingSwapsCount([{ status: 'pending' }, { status: 'accepted' }]), 1);

    const supportLast = getSupportLastMessage([
        { id: '1', createdAt: '2026-02-10T10:00:00.000Z' },
        { id: '2', createdAt: '2026-02-10T12:00:00.000Z' },
    ]);
    assert.equal(supportLast?.id, '2');

    const storage = createStorage({
        [getThreadSeenKey('match-1')]: '2026-02-10T09:00:00.000Z',
    });
    assert.equal(isThreadUnread({
        id: 'match-1',
        lastMessage: { sender: { id: 'u2' }, createdAt: '2026-02-10T10:00:00.000Z' },
    }, { myUserId: 'u1', storage }), true);

    assert.equal(isThreadUnread({
        id: 'match-2',
        lastMessage: { sender: { id: 'u1' }, createdAt: '2026-02-10T10:00:00.000Z' },
    }, { myUserId: 'u1', storage }), false);

    const badges = computeMenuBadgeCounts({
        incomingSwaps: [{ status: 'pending' }, { status: 'accepted' }],
        outgoingSwaps: [{ status: 'pending' }, { status: 'pending' }],
        messageThreads: [
            { id: 'match-1', lastMessage: { sender: { id: 'u2' }, createdAt: '2026-02-10T10:00:00.000Z' } },
            { id: 'match-2', lastMessage: { sender: { id: 'u1' }, createdAt: '2026-02-10T10:05:00.000Z' } },
        ],
    }, { myUserId: 'u1', storage });

    assert.deepEqual(badges, {
        incoming: 1,
        outgoing: 2,
        messages: 1,
    });
}

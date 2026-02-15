import assert from 'node:assert/strict';
import { computeMenuBadgeCounts, markThreadsSeen, getThreadSeenKey } from './menuBadges.js';

function createStorage() {
    const memory = new Map();
    return {
        getItem(key) {
            return memory.has(key) ? memory.get(key) : null;
        },
        setItem(key, value) {
            memory.set(key, String(value));
        },
    };
}

export function runMenuBadgesFunctionalTests() {
    const storage = createStorage();
    const myUserId = 'me';
    const threads = [
        {
            id: 'support',
            lastMessage: {
                sender: { id: 'admin-1' },
                createdAt: '2026-02-14T11:00:00.000Z',
            },
        },
        {
            id: 'match-100',
            lastMessage: {
                sender: { id: 'user-2' },
                createdAt: '2026-02-14T12:00:00.000Z',
            },
        },
    ];

    const beforeRead = computeMenuBadgeCounts({
        incomingSwaps: [{ status: 'pending' }],
        outgoingSwaps: [{ status: 'accepted' }],
        messageThreads: threads,
    }, { myUserId, storage });
    assert.equal(beforeRead.messages, 2);

    markThreadsSeen(threads, { storage });
    const afterRead = computeMenuBadgeCounts({
        incomingSwaps: [{ status: 'pending' }],
        outgoingSwaps: [{ status: 'accepted' }],
        messageThreads: threads,
    }, { myUserId, storage });

    assert.equal(storage.getItem(getThreadSeenKey('support')), '2026-02-14T11:00:00.000Z');
    assert.equal(afterRead.messages, 0);
    assert.equal(afterRead.incoming, 1);
    assert.equal(afterRead.outgoing, 0);
}

const THREAD_SEEN_KEY_PREFIX = 'yk_thread_seen_';

function toTimestamp(value) {
    const timestamp = Date.parse(value || '');
    return Number.isFinite(timestamp) ? timestamp : 0;
}

function getStorage(storage) {
    if (storage) return storage;
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
    return null;
}

export function getThreadSeenKey(threadId) {
    return `${THREAD_SEEN_KEY_PREFIX}${threadId}`;
}

export function getPendingSwapsCount(swaps = []) {
    return swaps.filter((swap) => swap?.status === 'pending').length;
}

export function getSupportLastMessage(messages = []) {
    if (!Array.isArray(messages) || messages.length === 0) return null;
    return [...messages].sort((a, b) => toTimestamp(a?.createdAt) - toTimestamp(b?.createdAt)).at(-1) || null;
}

export function isThreadUnread(thread, options = {}) {
    if (!thread?.id || !thread?.lastMessage) return false;

    const senderId = thread.lastMessage.sender?.id || '';
    const lastMessageAt = toTimestamp(thread.lastMessage.createdAt || thread.lastMessageAt);
    if (!senderId || !lastMessageAt) return false;

    const myUserId = options.myUserId || '';
    if (myUserId && senderId === myUserId) return false;

    const storage = getStorage(options.storage);
    const seenRaw = storage?.getItem(getThreadSeenKey(thread.id));
    const seenAt = toTimestamp(seenRaw);
    return lastMessageAt > seenAt;
}

export function getUnreadThreadsCount(threads = [], options = {}) {
    if (!Array.isArray(threads) || threads.length === 0) return 0;
    return threads.reduce((count, thread) => (isThreadUnread(thread, options) ? count + 1 : count), 0);
}

export function markThreadSeen(thread, options = {}) {
    if (!thread?.id || !thread?.lastMessage) return;
    const storage = getStorage(options.storage);
    if (!storage) return;

    const seenAt = thread.lastMessage.createdAt || thread.lastMessageAt || new Date().toISOString();
    storage.setItem(getThreadSeenKey(thread.id), seenAt);
}

export function markThreadsSeen(threads = [], options = {}) {
    if (!Array.isArray(threads) || threads.length === 0) return;
    threads.forEach((thread) => markThreadSeen(thread, options));
}

export function computeMenuBadgeCounts(payload = {}, options = {}) {
    const incoming = Number.isFinite(payload.incomingCount)
        ? payload.incomingCount
        : getPendingSwapsCount(payload.incomingSwaps || []);
    const outgoing = Number.isFinite(payload.outgoingCount)
        ? payload.outgoingCount
        : getPendingSwapsCount(payload.outgoingSwaps || []);
    const unread = getUnreadThreadsCount(payload.messageThreads || [], options);

    return {
        incoming,
        outgoing,
        messages: unread,
    };
}

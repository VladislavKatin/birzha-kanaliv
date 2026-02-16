export function buildFallbackAvatar(name = 'Канал') {
    const safeName = encodeURIComponent(String(name || 'Канал'));
    return `https://ui-avatars.com/api/?name=${safeName}&background=005bbb&color=fff&size=128`;
}

export function resolveChannelAvatar(avatarUrl, channelName) {
    const src = String(avatarUrl || '').trim();
    return src || buildFallbackAvatar(channelName);
}

export function handleAvatarError(event) {
    const target = event.currentTarget;
    const fallback = target?.dataset?.fallbackSrc || '';
    if (fallback && target.src !== fallback) {
        target.src = fallback;
    }
}


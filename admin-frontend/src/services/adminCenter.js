export function normalizeAdminOverview(raw = {}) {
    return {
        generatedAt: raw.generatedAt || null,
        summary: {
            totalUsers: Number(raw.summary?.totalUsers || 0),
            totalChannels: Number(raw.summary?.totalChannels || 0),
            totalOffers: Number(raw.summary?.totalOffers || 0),
            totalMatches: Number(raw.summary?.totalMatches || 0),
            totalMessages: Number(raw.summary?.totalMessages || 0),
            totalReviews: Number(raw.summary?.totalReviews || 0),
            newUsers7d: Number(raw.summary?.newUsers7d || 0),
            matchesCompleted7d: Number(raw.summary?.matchesCompleted7d || 0),
        },
        distributions: {
            offersByStatus: Array.isArray(raw.distributions?.offersByStatus) ? raw.distributions.offersByStatus : [],
            matchesByStatus: Array.isArray(raw.distributions?.matchesByStatus) ? raw.distributions.matchesByStatus : [],
            topNiches: Array.isArray(raw.distributions?.topNiches) ? raw.distributions.topNiches : [],
        },
        recent: {
            users: Array.isArray(raw.recent?.users) ? raw.recent.users : [],
            matches: Array.isArray(raw.recent?.matches) ? raw.recent.matches : [],
            messages: Array.isArray(raw.recent?.messages) ? raw.recent.messages : [],
        },
    };
}

export function normalizeAdminUsers(raw = {}) {
    const users = Array.isArray(raw.users) ? raw.users : [];
    return {
        page: Number(raw.page || 1),
        limit: Number(raw.limit || 20),
        total: Number(raw.total || 0),
        pages: Number(raw.pages || 1),
        users: users.map((user) => ({
            id: user.id,
            email: user.email || '',
            displayName: user.displayName || '',
            role: user.role || 'user',
            channelCount: Number(user.channelCount || 0),
            createdAt: user.createdAt || null,
            updatedAt: user.updatedAt || null,
        })),
    };
}

export function formatAdminDate(value) {
    if (!value) return '-';

    return new Date(value).toLocaleString('uk-UA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

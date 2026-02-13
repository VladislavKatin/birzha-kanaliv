const axios = require('axios');

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const YT_DATA_BASE = 'https://www.googleapis.com/youtube/v3';
const YT_ANALYTICS_BASE = 'https://youtubeanalytics.googleapis.com/v2/reports';

class YouTubeService {
    constructor() {
        this.clientId = process.env.GOOGLE_CLIENT_ID;
        this.clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        this.redirectUri = process.env.GOOGLE_REDIRECT_URI;
    }

    /**
     * Build Google OAuth consent URL
     */
    getAuthUrl(state) {
        const scopes = [
            'https://www.googleapis.com/auth/youtube.readonly',
            'https://www.googleapis.com/auth/yt-analytics.readonly',
        ].join(' ');

        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            scope: scopes,
            access_type: 'offline',
            prompt: 'consent',
            state: state || '',
        });

        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    /**
     * Exchange authorization code for access & refresh tokens
     */
    async exchangeCodeForTokens(code) {
        const response = await axios.post(GOOGLE_TOKEN_URL, {
            code,
            client_id: this.clientId,
            client_secret: this.clientSecret,
            redirect_uri: this.redirectUri,
            grant_type: 'authorization_code',
        });

        return {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
            expiresIn: response.data.expires_in,
        };
    }

    /**
     * Refresh an expired access token
     */
    async refreshAccessToken(refreshToken) {
        const response = await axios.post(GOOGLE_TOKEN_URL, {
            refresh_token: refreshToken,
            client_id: this.clientId,
            client_secret: this.clientSecret,
            grant_type: 'refresh_token',
        });

        return {
            accessToken: response.data.access_token,
            expiresIn: response.data.expires_in,
        };
    }

    /**
     * Get authenticated user's own channel info
     */
    async getMyChannel(accessToken) {
        const response = await axios.get(`${YT_DATA_BASE}/channels`, {
            params: {
                part: 'snippet,statistics,contentDetails',
                mine: true,
            },
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const item = response.data.items?.[0];
        if (!item) return null;

        const snippet = item.snippet || {};
        const stats = item.statistics || {};

        return {
            channelId: item.id,
            channelTitle: snippet.title,
            channelAvatar: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
            description: snippet.description,
            country: snippet.country,
            subscribers: parseInt(stats.subscriberCount) || 0,
            totalViews: parseInt(stats.viewCount) || 0,
            totalVideos: parseInt(stats.videoCount) || 0,
        };
    }

    /**
     * Fetch YouTube Analytics data for a channel (last 30 days)
     */
    async getChannelAnalytics(accessToken, channelId) {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        try {
            const response = await axios.get(YT_ANALYTICS_BASE, {
                params: {
                    ids: `channel==${channelId}`,
                    startDate,
                    endDate,
                    metrics: 'views,subscribersGained,subscribersLost,averageViewDuration,cardClickRate',
                    dimensions: '',
                },
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            const row = response.data.rows?.[0] || [];
            const views30d = row[0] || 0;
            const subsGained = row[1] || 0;
            const subsLost = row[2] || 0;
            const avgWatchTime = row[3] || 0;
            const ctr = row[4] || 0;

            return {
                avgViews30d: Math.round(views30d / 30),
                subGrowth30d: subsGained - subsLost,
                averageWatchTime: Math.round(avgWatchTime * 100) / 100,
                ctr: Math.round(ctr * 10000) / 100, // as percentage
            };
        } catch (error) {
            console.error('YouTube Analytics API error:', error.response?.data || error.message);
            return {
                avgViews30d: 0,
                subGrowth30d: 0,
                averageWatchTime: 0,
                ctr: 0,
            };
        }
    }

    /**
     * Fetch last N videos with stats
     */
    async getRecentVideos(accessToken, channelId, count = 10) {
        try {
            // Get uploads playlist
            const channelRes = await axios.get(`${YT_DATA_BASE}/channels`, {
                params: { part: 'contentDetails', id: channelId },
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            const uploadsId = channelRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
            if (!uploadsId) return [];

            // Get playlist items
            const playlistRes = await axios.get(`${YT_DATA_BASE}/playlistItems`, {
                params: {
                    part: 'snippet,contentDetails',
                    playlistId: uploadsId,
                    maxResults: count,
                },
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            const videoIds = (playlistRes.data.items || [])
                .map((item) => item.contentDetails.videoId)
                .join(',');

            if (!videoIds) return [];

            // Get video statistics
            const videosRes = await axios.get(`${YT_DATA_BASE}/videos`, {
                params: { part: 'snippet,statistics', id: videoIds },
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            return (videosRes.data.items || []).map((v) => ({
                videoId: v.id,
                title: v.snippet.title,
                views: parseInt(v.statistics.viewCount) || 0,
                likes: parseInt(v.statistics.likeCount) || 0,
                comments: parseInt(v.statistics.commentCount) || 0,
                publishedAt: v.snippet.publishedAt,
                thumbnail: v.snippet.thumbnails?.medium?.url,
            }));
        } catch (error) {
            console.error('Error fetching recent videos:', error.response?.data || error.message);
            return [];
        }
    }

    /**
     * Detect anomalous subscriber growth (anti-abuse)
     */
    detectAnomalousGrowth(currentSubs, previousSubs) {
        if (previousSubs <= 0) return false;
        const growthRate = (currentSubs - previousSubs) / previousSubs;
        // Flag if growth exceeds 50% in a single analytics update period (24h)
        return growthRate > 0.5;
    }
}

module.exports = new YouTubeService();

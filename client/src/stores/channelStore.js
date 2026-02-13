import { create } from 'zustand';
import api from '../services/api';

/**
 * Channel store — manages user's YouTube channels.
 */
const useChannelStore = create((set, get) => ({
    // ── State ──────────────────────────────────────────────
    channels: [],
    selectedChannel: null,
    loading: false,
    error: null,

    // ── Actions ───────────────────────────────────────────

    /** Fetch all user channels */
    fetchChannels: async () => {
        set({ loading: true, error: null });
        try {
            const response = await api.get('/channels/my');
            set({ channels: response.data.channels || [], loading: false });
        } catch (err) {
            set({ error: 'Не вдалося завантажити канали', loading: false });
            console.error('Fetch channels error:', err);
        }
    },

    /** Select a channel by ID */
    selectChannel: (channelId) => {
        const channel = get().channels.find(c => c.id === channelId) || null;
        set({ selectedChannel: channel });
    },

    /** Add a channel (after YouTube connect) */
    addChannel: (channel) => {
        set(state => ({ channels: [...state.channels, channel] }));
    },

    /** Update a channel */
    updateChannel: async (channelId, data) => {
        try {
            const response = await api.put(`/channels/${channelId}`, data);
            set(state => ({
                channels: state.channels.map(c =>
                    c.id === channelId ? { ...c, ...response.data.channel } : c
                ),
            }));
            return response.data;
        } catch (err) {
            console.error('Update channel error:', err);
            throw err;
        }
    },

    /** Delete a channel */
    deleteChannel: async (channelId) => {
        try {
            await api.delete(`/channels/${channelId}`);
            set(state => ({
                channels: state.channels.filter(c => c.id !== channelId),
                selectedChannel: state.selectedChannel?.id === channelId ? null : state.selectedChannel,
            }));
        } catch (err) {
            console.error('Delete channel error:', err);
            throw err;
        }
    },

    /** Clear all channel state */
    reset: () => set({ channels: [], selectedChannel: null, loading: false, error: null }),
}));

export default useChannelStore;

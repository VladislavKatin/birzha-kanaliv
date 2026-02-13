import { create } from 'zustand';
import api from '../services/api';

/**
 * Swap store — manages incoming/outgoing swaps and active exchanges.
 */
const useSwapStore = create((set) => ({
    // ── State ──────────────────────────────────────────────
    incoming: [],
    outgoing: [],
    exchanges: [],
    loadingIncoming: false,
    loadingOutgoing: false,
    loadingExchanges: false,
    error: null,

    // ── Actions ───────────────────────────────────────────

    /** Fetch incoming swap proposals */
    fetchIncoming: async () => {
        set({ loadingIncoming: true, error: null });
        try {
            const response = await api.get('/swaps/incoming');
            set({ incoming: response.data.swaps || [], loadingIncoming: false });
        } catch (err) {
            set({ error: 'Не вдалося завантажити вхідні', loadingIncoming: false });
            console.error('Fetch incoming error:', err);
        }
    },

    /** Fetch outgoing swap proposals */
    fetchOutgoing: async () => {
        set({ loadingOutgoing: true, error: null });
        try {
            const response = await api.get('/swaps/outgoing');
            set({ outgoing: response.data.swaps || [], loadingOutgoing: false });
        } catch (err) {
            set({ error: 'Не вдалося завантажити вихідні', loadingOutgoing: false });
            console.error('Fetch outgoing error:', err);
        }
    },

    /** Fetch completed exchanges */
    fetchExchanges: async () => {
        set({ loadingExchanges: true, error: null });
        try {
            const response = await api.get('/exchanges');
            set({ exchanges: response.data.exchanges || [], loadingExchanges: false });
        } catch (err) {
            set({ error: 'Не вдалося завантажити обміни', loadingExchanges: false });
            console.error('Fetch exchanges error:', err);
        }
    },

    /** Accept an incoming swap */
    acceptSwap: async (swapId) => {
        try {
            const response = await api.post(`/swaps/${swapId}/accept`);
            set(state => ({
                incoming: state.incoming.filter(s => s.id !== swapId),
            }));
            return response.data;
        } catch (err) {
            console.error('Accept swap error:', err);
            throw err;
        }
    },

    /** Decline/reject an incoming swap */
    rejectSwap: async (swapId) => {
        try {
            await api.post(`/swaps/${swapId}/decline`);
            set(state => ({
                incoming: state.incoming.filter(s => s.id !== swapId),
                outgoing: state.outgoing.filter(s => s.id !== swapId),
            }));
        } catch (err) {
            console.error('Reject swap error:', err);
            throw err;
        }
    },

    /** Confirm completion of an exchange */
    confirmExchange: async (matchId) => {
        try {
            const response = await api.put(`/matches/${matchId}/confirm`);
            return response.data;
        } catch (err) {
            console.error('Confirm exchange error:', err);
            throw err;
        }
    },

    /** Clear all swap state */
    reset: () => set({
        incoming: [],
        outgoing: [],
        exchanges: [],
        loadingIncoming: false,
        loadingOutgoing: false,
        loadingExchanges: false,
        error: null,
    }),
}));

export default useSwapStore;

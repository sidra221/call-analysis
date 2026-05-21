import { create } from 'zustand';
import { callsApi } from 'api/api';

const useCallsStore = create((set) => ({
  calls: [],
  loading: false,
  error: null,

  // ─── Fetch Calls ─────────────────────
  fetchCalls: async (params = {}) => {
    set({ loading: true, error: null });

    try {
      const res = await callsApi.list(params);

      // request() يرجع JSON مباشرة (مش res.data)
      const results = res?.results || res || [];

      set({
        calls: results,
        loading: false,
      });
    } catch (err) {
      set({
        error: err.message,
        loading: false,
      });
    }
  },

  // ─── Upload Call ─────────────────────
  uploadCall: async (formData) => {
    const res = await callsApi.create(formData);

    console.log('UPLOAD API RESPONSE:', res);

    // res هو object مباشر
    const newCall = res?.data || res;

    if (newCall) {
      set((state) => ({
        calls: [newCall, ...state.calls],
      }));
    }

    return newCall;
  },

  // ─── Process Call ────────────────────
  processCall: async (id) => {
    const res = await callsApi.process(id);

    set((state) => ({
      calls: state.calls.map((c) =>
        c.id === id ? { ...c, status: 'processing' } : c
      ),
    }));

    return res;
  },

  // ─── WebSocket Update ────────────────
  updateCallFromWebSocket: (callId) => {
    callsApi.get(callId).then((res) => {
      const updated = res?.data || res;

      if (updated) {
        set((state) => ({
          calls: state.calls.map((c) =>
            String(c.id) === String(callId) ? updated : c
          ),
        }));
      }
    });
  },

  // ─── Mark Reviewed ───────────────────
  markReviewed: async (id) => {
    await callsApi.markReviewed(id);

    set((state) => ({
      calls: state.calls.map((c) =>
        c.id === id
          ? {
              ...c,
              analysis: {
                ...c.analysis,
                is_reviewed: true,
              },
            }
          : c
      ),
    }));
  },

  // ─── Patch Call ──────────────────────
  patchCall: async (id, data) => {
    const res = await callsApi.patch(id, data);
    const updated = res?.data || res;

    if (updated) {
      set((state) => ({
        calls: state.calls.map((c) =>
          c.id === id ? updated : c
        ),
      }));
    }

    return updated;
  },

  // ─── Remove Call ─────────────────────
  removeCall: (id) => {
    set((state) => ({
      calls: state.calls.filter((c) => c.id !== id),
    }));
  },
}));

export default useCallsStore;
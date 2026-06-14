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
      let all = [];
      let page = 1;
      let total = Infinity;

      while (all.length < total) {
        const res = await callsApi.list({ ...params, page, page_size: 100 });
        const payload = res?.data ?? res;
        const results = payload?.results || (Array.isArray(payload) ? payload : []);
        const count = payload?.count ?? results.length;

        all = [...all, ...results];
        total = count;
        if (!results.length) break;
        page += 1;
      }

      set({
        calls: all,
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
    try {
      const res = await callsApi.create(formData);

      console.log('UPLOAD API RESPONSE:', res);

      // ✅ دعم كل الاحتمالات
      const newCall =
        res?.data ||
        res?.call ||
        res;

      if (!newCall?.id) {
        console.error('NO ID RETURNED FROM BACKEND:', res);
      }

      if (newCall) {
        set((state) => ({
          calls: [newCall, ...state.calls],
        }));
      }

      return newCall;
    } catch (err) {
      console.error('UPLOAD STORE ERROR:', err);
      throw err;
    }
  },

  // ─── Process Call ────────────────────
  processCall: async (id) => {
    const res = await callsApi.process(id);

    set((state) => ({
      calls: state.calls.map((c) =>
        c.id === id
          ? { ...c, status: 'processing' }
          : c
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
            String(c.id) === String(callId)
              ? updated
              : c
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
          c.id === id
            ? updated
            : c
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
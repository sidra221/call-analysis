import { create } from 'zustand';
import { callsApi } from 'api/api';

// ─────────────────────────────────────────
// Calls store — manages call list state
// Fetches from Backend instead of localStorage
// ─────────────────────────────────────────
const useCallsStore = create((set, get) => ({
  calls: [],
  loading: false,
  error: null,

  // Fetch all calls from Backend with optional filters
  fetchCalls: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const res = await callsApi.list(params);
      // Backend returns paginated response: { success, data: { results, count } }
      const results = res?.data?.results || res?.data || [];
      set({ calls: results, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  // Upload a new call audio file
  uploadCall: async (formData) => {
    const res = await callsApi.create(formData);
    const newCall = res?.data;
    if (newCall) {
      set((state) => ({ calls: [newCall, ...state.calls] }));
    }
    return newCall;
  },

  // Trigger AI analysis for a call
  processCall: async (id) => {
    const res = await callsApi.process(id);
    // Update call status to processing in local state immediately
    set((state) => ({
      calls: state.calls.map((c) =>
        c.id === id ? { ...c, status: 'processing' } : c
      )
    }));
    return res?.data;
  },

  // Update a call after WebSocket notifies analysis is complete
  updateCallFromWebSocket: (callId) => {
    callsApi.get(callId).then((res) => {
      const updated = res?.data;
      if (updated) {
        set((state) => ({
          calls: state.calls.map((c) => (c.id === callId ? updated : c))
        }));
      }
    });
  },

  // Mark a call as reviewed
  markReviewed: async (id) => {
    await callsApi.markReviewed(id);
    set((state) => ({
      calls: state.calls.map((c) =>
        c.id === id
          ? { ...c, analysis: { ...c.analysis, is_reviewed: true } }
          : c
      )
    }));
  },

  // Patch call or analysis fields
  patchCall: async (id, data) => {
    const res = await callsApi.patch(id, data);
    const updated = res?.data;
    if (updated) {
      set((state) => ({
        calls: state.calls.map((c) => (c.id === id ? updated : c))
      }));
    }
    return updated;
  },

  // Remove a call from local state (no delete endpoint exists)
  removeCall: (id) => {
    set((state) => ({
      calls: state.calls.filter((c) => c.id !== id)
    }));
  }
}));

export default useCallsStore;

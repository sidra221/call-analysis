import { create } from 'zustand';
import { callsApi } from 'api/api';

const idleUploadJob = {
  active: false,
  overlayVisible: false,
  current: 0,
  total: 0,
  progress: 0,
  label: '',
  phase: 'idle',
  error: ''
};

const useCallsStore = create((set, get) => ({
  calls: [],
  loading: false,
  error: null,
  uploadJob: { ...idleUploadJob },

  startUploadJob: (total, label) => set({
    uploadJob: {
      ...idleUploadJob,
      active: true,
      overlayVisible: true,
      total,
      current: Math.min(1, total),
      progress: 5,
      label,
      phase: 'uploading'
    }
  }),

  updateUploadJob: (patch) => set((state) => ({
    uploadJob: { ...state.uploadJob, ...patch }
  })),

  continueWorking: () => set((state) => ({
    uploadJob: { ...state.uploadJob, overlayVisible: false }
  })),

  finishUploadJob: () => set({ uploadJob: { ...idleUploadJob } }),

  watchUploadedCalls: async (ids) => {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    if (!ids.length) {
      set((state) => ({
        uploadJob: { ...state.uploadJob, phase: 'done', progress: 100 }
      }));
      await sleep(1200);
      set({ uploadJob: { ...idleUploadJob } });
      return;
    }

    set((state) => ({
      uploadJob: {
        ...state.uploadJob,
        phase: 'analyzing',
        current: 0,
        total: ids.length,
        progress: Math.max(state.uploadJob.progress, 55)
      }
    }));

    const pending = new Set(ids.map(String));
    let waited = 0;
    const maxWait = 300;

    while (pending.size && waited < maxWait) {
      await sleep(2000);
      waited += 2;
      if (!get().uploadJob.active) return;

      await Promise.all([...pending].map(async (id) => {
        try {
          const res = await callsApi.get(id);
          const status = (res?.data || res)?.status;
          if (status === 'completed' || status === 'failed') pending.delete(id);
        } catch { /* keep waiting */ }
      }));

      const doneCount = ids.length - pending.size;
      set((state) => ({
        uploadJob: {
          ...state.uploadJob,
          current: doneCount,
          total: ids.length,
          progress: Math.min(95, 55 + Math.round((doneCount / ids.length) * 40))
        }
      }));
    }

    await get().fetchCalls();
    set((state) => ({
      uploadJob: { ...state.uploadJob, phase: 'done', progress: 100, current: ids.length, total: ids.length }
    }));
    await sleep(1200);
    set({ uploadJob: { ...idleUploadJob } });
  },

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
import { create } from 'zustand';
import { usersApi } from 'api/api';

const useUsersStore = create((set) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const res = await usersApi.list();
      const results = res?.data || [];
      set({ users: results, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  addUser: async (userData) => {
    await usersApi.register(userData);
  },

  updateUser: async (id, data) => {
    const res = await usersApi.update(id, data);
    const updated = res?.data || res;
    set((state) => ({
      users: state.users.map((u) => (String(u.id) === String(id) ? updated : u))
    }));
    return updated;
  },

  deleteUser: async (id) => {
    await usersApi.delete(id);
    set((state) => ({
      users: state.users.filter((u) => String(u.id) !== String(id))
    }));
  }
}));

export default useUsersStore;
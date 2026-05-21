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
    const res = await usersApi.register(userData);
    const newUser = res?.data;
    if (newUser) {
      set((state) => ({ users: [...state.users, newUser] }));
    }
    return newUser;
  },

  deleteUser: async (id) => {
    await usersApi.delete(id);
    set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
  }
}));

export default useUsersStore;
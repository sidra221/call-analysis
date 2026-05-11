import { create } from 'zustand';

const useSearchStore = create((set) => ({
  search: '',
  setSearch: (value) => set({ search: value })
}));

export default useSearchStore;
import { create } from 'zustand';

const useSearchStore = create((set) => ({
  search: '',
  isOpen: false,
  results: [],
  setSearch: (value) => set({ search: value }),
  setIsOpen: (value) => set({ isOpen: value }),
  setResults: (results) => set({ results })
}));

export default useSearchStore;
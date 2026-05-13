import { create } from 'zustand';

const defaultUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@test.com',
    role: 'Admin',
    createdAt: '01-05-2026',
    avatar: 'https://i.pravatar.cc/150?img=1'
  },
  {
    id: 2,
    username: 'agent1',
    email: 'agent@test.com',
    role: 'Agent',
    createdAt: '11-03-2026',
    avatar: 'https://i.pravatar.cc/150?img=2'
  }
];

const useUsersStore = create((set) => ({
  users: defaultUsers,
  setUsers: (users) => set({ users })
}));

export default useUsersStore;

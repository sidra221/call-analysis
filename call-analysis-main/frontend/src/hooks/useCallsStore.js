import { create } from 'zustand';

const defaultCalls = [
  {
    id: 'C-1',
    status: 'pending',
    sentiment: 'neutral',
    priority: 'medium',
    reviewed: 'No',
    duration: '01:20',
    createdAt: '01-05-2026',
    uploadedBy: 'System',
    issue: 'Billing Problem',
    transcript: 'Customer called about billing issue',
    keywords: 'billing, refund'
  },
   {
    id: 'C-2',
    status: 'pending',
    sentiment: 'neutral',
    priority: 'medium',
    reviewed: 'No',
    duration: '01:20',
    createdAt: '01-05-2026',
    uploadedBy: 'System',
    issue: 'Billing Problem',
    transcript: 'Customer called about billing issue',
    keywords: 'billing, refund'
  },
  {
    id: 'C-3',
    status: 'pending',
    sentiment: 'neutral',
    priority: 'medium',
    reviewed: 'No',
    duration: '01:20',
    createdAt: '01-05-2026',
    uploadedBy: 'System',
    issue: 'Billing Problem',
    transcript: 'Customer called about billing issue',
    keywords: 'billing, refund'
  },
   {
    id: 'C-4',
    status: 'pending',
    sentiment: 'neutral',
    priority: 'medium',
    reviewed: 'No',
    duration: '01:20',
    createdAt: '01-05-2026',
    uploadedBy: 'System',
    issue: 'Billing Problem',
    transcript: 'Customer called about billing issue',
    keywords: 'billing, refund'
  },
   {
    id: 'C-5',
    status: 'pending',
    sentiment: 'neutral',
    priority: 'medium',
    reviewed: 'No',
    duration: '01:20',
    createdAt: '01-05-2026',
    uploadedBy: 'System',
    issue: 'Billing Problem',
    transcript: 'Customer called about billing issue',
    keywords: 'billing, refund'
  }, {
    id: 'C-6',
    status: 'pending',
    sentiment: 'neutral',
    priority: 'medium',
    reviewed: 'No',
    duration: '01:20',
    createdAt: '01-05-2026',
    uploadedBy: 'System',
    issue: 'Billing Problem',
    transcript: 'Customer called about billing issue',
    keywords: 'billing, refund'
  }, {
    id: 'C-7',
    status: 'pending',
    sentiment: 'neutral',
    priority: 'medium',
    reviewed: 'No',
    duration: '01:20',
    createdAt: '01-05-2026',
    uploadedBy: 'System',
    issue: 'Billing Problem',
    transcript: 'Customer called about billing issue',
    keywords: 'billing, refund'
  },
   {
    id: 'C-8',
    status: 'pending',
    sentiment: 'neutral',
    priority: 'medium',
    reviewed: 'No',
    duration: '01:20',
    createdAt: '01-05-2026',
    uploadedBy: 'System',
    issue: 'Billing Problem',
    transcript: 'Customer called about billing issue',
    keywords: 'billing, refund'
  },
   {
    id: 'C-9',
    status: 'pending',
    sentiment: 'neutral',
    priority: 'medium',
    reviewed: 'No',
    duration: '01:20',
    createdAt: '01-05-2026',
    uploadedBy: 'System',
    issue: 'Billing Problem',
    transcript: 'Customer called about billing issue',
    keywords: 'billing, refund'
  },
   {
    id: 'C-10',
    status: 'pending',
    sentiment: 'neutral',
    priority: 'medium',
    reviewed: 'No',
    duration: '01:20',
    createdAt: '01-05-2026',
    uploadedBy: 'System',
    issue: 'Billing Problem',
    transcript: 'Customer called about billing issue',
    keywords: 'billing, refund'
  },
   {
    id: 'C-11',
    status: 'pending',
    sentiment: 'neutral',
    priority: 'medium',
    reviewed: 'No',
    duration: '01:20',
    createdAt: '01-05-2026',
    uploadedBy: 'System',
    issue: 'Billing Problem',
    transcript: 'Customer called about billing issue',
    keywords: 'billing, refund'
  }
];

const stored = JSON.parse(localStorage.getItem('calls'));
const isOutdated = stored?.some(c => !c.duration || !c.createdAt || !c.uploadedBy);
const handleDelete = (id) => {
  const updated = calls.filter((c) => c.id !== id);
  setCalls(updated);
};
const useCallsStore = create((set) => ({
  calls: !stored || isOutdated ? defaultCalls : stored,

  setCalls: (newCalls) => {
    set({ calls: newCalls });
    localStorage.setItem('calls', JSON.stringify(newCalls));
  }
}));

export default useCallsStore;
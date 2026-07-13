// ============================================
// Pundi — Sync & Queue Store (Zustand)
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { haptic } from '@/lib/utils/haptic';

export interface QueueItem {
  id: string;
  table: 'wallets' | 'transactions' | 'debts' | 'receivables' | 'receivable_payments' | 'split_bill_sessions' | 'split_participants' | 'profiles';
  action: 'insert' | 'update' | 'delete' | 'upsert';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  timestamp: string;
}

interface SyncState {
  isOnline: boolean;
  syncQueue: QueueItem[];
  isSyncing: boolean;
  lastSyncTime: string | null;
  lastError: string | null;

  // Computed
  getPendingCount: () => number;

  // Actions
  setOnline: (online: boolean) => void;
  addToQueue: (item: Omit<QueueItem, 'id' | 'timestamp'>) => void;
  processQueue: () => Promise<void>;
  clearQueue: () => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      syncQueue: [],
      isSyncing: false,
      lastSyncTime: null,
      lastError: null,

      getPendingCount: () => get().syncQueue.length,

      setOnline: (online) => {
        const wasOffline = !get().isOnline;
        set({ isOnline: online });
        
        // Trigger sync when coming back online
        if (online && wasOffline) {
          haptic('medium');
          get().processQueue();
        }
      },

      addToQueue: (item) => {
        const newItem: QueueItem = {
          ...item,
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          syncQueue: [...state.syncQueue, newItem],
        }));

        // Try processing immediately if online
        if (get().isOnline) {
          get().processQueue();
        }
      },

      processQueue: async () => {
        if (get().isSyncing || get().syncQueue.length === 0 || !get().isOnline) return;

        set({ isSyncing: true });

        // Simulate network delay for stubbed sync
        await new Promise(resolve => setTimeout(resolve, 500));

        // For local-first, we just consider it synced and clear the queue
        // In the future this would sync to Supabase
        set({
          syncQueue: [],
          isSyncing: false,
          lastSyncTime: new Date().toISOString(),
          lastError: null,
        });

        haptic('success');
      },

      clearQueue: () => set({ syncQueue: [] }),
    }),
    {
      name: 'pundi-sync',
    }
  )
);

// Register global connection listeners on client context
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useSyncStore.getState().setOnline(true));
  window.addEventListener('offline', () => useSyncStore.getState().setOnline(false));
}

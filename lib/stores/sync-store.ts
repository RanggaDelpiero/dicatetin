// ============================================
// Pundi — Sync & Queue Store (Zustand)
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase/client';
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

        // Get current user auth
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // If no authenticated user session, keep items in queue until logged in
          set({ isSyncing: false });
          return;
        }

        const queue = [...get().syncQueue];
        const failedItems: QueueItem[] = [];

        // Group adjacent items with same table and action to batch inserts/upserts
        const batches: { table: QueueItem['table']; action: QueueItem['action']; items: QueueItem[] }[] = [];
        let currentBatch: { table: QueueItem['table']; action: QueueItem['action']; items: QueueItem[] } | null = null;

        for (const item of queue) {
          if (
            currentBatch &&
            currentBatch.table === item.table &&
            currentBatch.action === item.action &&
            (item.action === 'insert' || item.action === 'upsert')
          ) {
            currentBatch.items.push(item);
          } else {
            if (currentBatch) batches.push(currentBatch);
            currentBatch = {
              table: item.table,
              action: item.action,
              items: [item],
            };
          }
        }
        if (currentBatch) batches.push(currentBatch);

        for (const batch of batches) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const payloads: any[] = batch.items.map((item) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const payload: any = {
                ...item.payload,
                user_id: session.user.id,
              };

              // Remove relations that should not be sent directly (nested objects)
              if (payload.category) delete payload.category;
              if (payload.wallet) delete payload.wallet;
              if (payload.target_wallet) delete payload.target_wallet;

              return payload;
            });

            if (batch.action === 'insert' || batch.action === 'upsert') {
              const { error } = await supabase
                .from(batch.table)
                .upsert(payloads);
              if (error) throw error;
            } else {
              // For update and delete, process sequentially within the batch to ensure proper failure handling
              for (let i = 0; i < batch.items.length; i++) {
                const item = batch.items[i];
                const payload = payloads[i];
                try {
                  if (item.action === 'update') {
                    const { error } = await supabase
                      .from(item.table)
                      .update(payload)
                      .eq('id', payload.id);
                    if (error) throw error;
                  } else if (item.action === 'delete') {
                    const { error } = await supabase
                      .from(item.table)
                      .delete()
                      .eq('id', payload.id);
                    if (error) throw error;
                  }
                } catch (err) {
                  console.error(`[Sync] Failed to process ${item.action} on ${item.table}:`, err);
                  failedItems.push(item);
                }
              }
            }
          } catch (err) {
            console.error(`[Sync] Failed to process batch ${batch.action} on ${batch.table}:`, err);
            failedItems.push(...batch.items);
          }
        }

        set({
          syncQueue: failedItems,
          isSyncing: false,
        });

        if (failedItems.length === 0) {
          haptic('success');
        }
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

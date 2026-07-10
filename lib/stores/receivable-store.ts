// ============================================
// Pundi — Receivable Store (Hutang Orang)
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Receivable, ReceivableStatus, ReceivablePayment } from '@/lib/types';
import { generateId } from '@/lib/data/presets';
import { useSyncStore } from '@/lib/stores/sync-store';

interface ReceivableState {
  receivables: Receivable[];
  payments: ReceivablePayment[];

  addReceivable: (r: Omit<Receivable, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Receivable;
  updateReceivable: (id: string, updates: Partial<Receivable>) => void;
  deleteReceivable: (id: string) => void;
  addPayment: (receivableId: string, amount: number, note?: string) => void;
  getPaymentsByReceivable: (receivableId: string) => ReceivablePayment[];
  getActiveReceivables: () => Receivable[];
  getPaidReceivables: () => Receivable[];
  getTotalReceivable: () => number;
}

export const useReceivableStore = create<ReceivableState>()(
  persist(
    (set, get) => ({
      receivables: [],
      payments: [],

      addReceivable: (r) => {
        const newR: Receivable = {
          ...r,
          id: generateId(),
          user_id: 'local-user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((state) => ({ receivables: [newR, ...state.receivables] }));

        useSyncStore.getState().addToQueue({
           table: 'receivables',
           action: 'insert',
           payload: newR,
        });

        return newR;
      },

      updateReceivable: (id, updates) => {
        const updatedReceivables = get().receivables.map((r) =>
          r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } : r
        );
        set({ receivables: updatedReceivables });

        const updatedR = updatedReceivables.find((r) => r.id === id);
        if (updatedR) {
           useSyncStore.getState().addToQueue({
             table: 'receivables',
             action: 'update',
             payload: updatedR,
           });
        }
      },

      deleteReceivable: (id) => {
        set((state) => ({
          receivables: state.receivables.filter((r) => r.id !== id),
          payments: state.payments.filter((p) => p.receivable_id !== id),
        }));

        useSyncStore.getState().addToQueue({
          table: 'receivables',
          action: 'delete',
          payload: { id },
        });
      },

      addPayment: (receivableId, amount, note) => {
        const payment: ReceivablePayment = {
          id: generateId(),
          receivable_id: receivableId,
          amount,
          date: new Date().toISOString(),
          note,
        };
        let updatedR: Receivable | null = null;
        set((state) => {
          const rec = state.receivables.find((r) => r.id === receivableId);
          if (!rec) return state;

          const newRemaining = Math.max(0, rec.remaining_amount - amount);
          const newStatus: ReceivableStatus =
            newRemaining <= 0 ? 'paid' : newRemaining < rec.total_amount ? 'partial' : 'unpaid';

          updatedR = {
             ...rec,
             remaining_amount: newRemaining,
             status: newStatus,
             updated_at: new Date().toISOString(),
          };

          return {
            payments: [payment, ...state.payments],
            receivables: state.receivables.map((r) => r.id === receivableId ? updatedR! : r),
          };
        });

        useSyncStore.getState().addToQueue({
           table: 'receivable_payments',
           action: 'insert',
           payload: payment,
        });

        if (updatedR) {
           useSyncStore.getState().addToQueue({
             table: 'receivables',
             action: 'update',
             payload: updatedR,
           });
        }
      },

      getPaymentsByReceivable: (receivableId) => {
        return get().payments.filter((p) => p.receivable_id === receivableId);
      },

      getActiveReceivables: () => {
        return get().receivables.filter((r) => r.status !== 'paid');
      },

      getPaidReceivables: () => {
        return get().receivables.filter((r) => r.status === 'paid');
      },

      getTotalReceivable: () => {
        return get()
          .receivables.filter((r) => r.status !== 'paid')
          .reduce((sum, r) => sum + r.remaining_amount, 0);
      },
    }),
    { name: 'pundi-receivables' }
  )
);

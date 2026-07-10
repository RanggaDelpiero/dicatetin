// ============================================
// Pundi — Debt Store (Hutang Saya)
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Debt, DebtStatus } from '@/lib/types';
import { generateId } from '@/lib/data/presets';
import { useSyncStore } from '@/lib/stores/sync-store';

interface DebtPayment {
  id: string;
  debt_id: string;
  amount: number;
  date: string;
  note?: string;
}

interface DebtState {
  debts: Debt[];
  payments: DebtPayment[];

  addDebt: (debt: Omit<Debt, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Debt;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  addPayment: (debtId: string, amount: number, note?: string) => void;
  getPaymentsByDebt: (debtId: string) => DebtPayment[];
  getActiveDebts: () => Debt[];
  getPaidDebts: () => Debt[];
  getTotalDebt: () => number;
}

export const useDebtStore = create<DebtState>()(
  persist(
    (set, get) => ({
      debts: [],
      payments: [],

      addDebt: (debt) => {
        const newDebt: Debt = {
          ...debt,
          id: generateId(),
          user_id: 'local-user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((state) => ({ debts: [newDebt, ...state.debts] }));

        useSyncStore.getState().addToQueue({
          table: 'debts',
          action: 'insert',
          payload: newDebt,
        });

        return newDebt;
      },

      updateDebt: (id, updates) => {
        const updatedDebts = get().debts.map((d) =>
          d.id === id ? { ...d, ...updates, updated_at: new Date().toISOString() } : d
        );
        set({ debts: updatedDebts });

        const updatedDebt = updatedDebts.find((d) => d.id === id);
        if (updatedDebt) {
           useSyncStore.getState().addToQueue({
             table: 'debts',
             action: 'update',
             payload: updatedDebt,
           });
        }
      },

      deleteDebt: (id) => {
        set((state) => ({
          debts: state.debts.filter((d) => d.id !== id),
          payments: state.payments.filter((p) => p.debt_id !== id),
        }));

        useSyncStore.getState().addToQueue({
          table: 'debts',
          action: 'delete',
          payload: { id },
        });
      },

      addPayment: (debtId, amount, note) => {
        const payment: DebtPayment = {
          id: generateId(),
          debt_id: debtId,
          amount,
          date: new Date().toISOString(),
          note,
        };
        let updatedDebt: Debt | null = null;
        set((state) => {
          const debt = state.debts.find((d) => d.id === debtId);
          if (!debt) return state;

          const newRemaining = Math.max(0, debt.remaining_amount - amount);
          const newStatus: DebtStatus = newRemaining <= 0 ? 'paid_off' : 'active';

          updatedDebt = {
             ...debt,
             remaining_amount: newRemaining,
             status: newStatus,
             updated_at: new Date().toISOString(),
          };

          return {
            payments: [payment, ...state.payments],
            debts: state.debts.map((d) => d.id === debtId ? updatedDebt! : d),
          };
        });

        if (updatedDebt) {
           useSyncStore.getState().addToQueue({
             table: 'debts',
             action: 'update',
             payload: updatedDebt,
           });
        }
      },

      getPaymentsByDebt: (debtId) => {
        return get().payments.filter((p) => p.debt_id === debtId);
      },

      getActiveDebts: () => {
        return get().debts.filter((d) => d.status === 'active');
      },

      getPaidDebts: () => {
        return get().debts.filter((d) => d.status === 'paid_off');
      },

      getTotalDebt: () => {
        return get()
          .debts.filter((d) => d.status === 'active')
          .reduce((sum, d) => sum + d.remaining_amount, 0);
      },
    }),
    { name: 'pundi-debts' }
  )
);

// ============================================
// Pundi — Debt Store (Hutang Saya)
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Debt, DebtStatus } from '@/lib/types';
import { generateId } from '@/lib/data/presets';
import { getCurrentUserId } from '@/lib/stores/auth-store';

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
          user_id: getCurrentUserId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((state) => ({ debts: [newDebt, ...state.debts] }));
        return newDebt;
      },

      updateDebt: (id, updates) => {
        set((state) => ({
          debts: state.debts.map((d) =>
            d.id === id ? { ...d, ...updates, updated_at: new Date().toISOString() } : d
          ),
        }));
      },

      deleteDebt: (id) => {
        set((state) => ({
          debts: state.debts.filter((d) => d.id !== id),
          payments: state.payments.filter((p) => p.debt_id !== id),
        }));
      },

      addPayment: (debtId, amount, note) => {
        const payment: DebtPayment = {
          id: generateId(),
          debt_id: debtId,
          amount,
          date: new Date().toISOString(),
          note,
        };
        set((state) => {
          const debt = state.debts.find((d) => d.id === debtId);
          if (!debt) return state;

          const newRemaining = Math.max(0, debt.remaining_amount - amount);
          const newStatus: DebtStatus = newRemaining <= 0 ? 'paid_off' : 'active';

          return {
            payments: [payment, ...state.payments],
            debts: state.debts.map((d) =>
              d.id === debtId
                ? {
                    ...d,
                    remaining_amount: newRemaining,
                    status: newStatus,
                    updated_at: new Date().toISOString(),
                  }
                : d
            ),
          };
        });
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

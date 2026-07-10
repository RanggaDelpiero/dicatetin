// ============================================
// Pundi — Recurring Transactions Store
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useTransactionStore } from './transaction-store';
import { useWalletStore } from './wallet-store';

export interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  category_id: string;
  wallet_id: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  next_due_date: string;
  status: 'active' | 'paused' | 'completed';
  note?: string;
  last_triggered_at?: string;
}

interface RecurringState {
  recurringTransactions: RecurringTransaction[];
  addRecurring: (item: Omit<RecurringTransaction, 'id' | 'last_triggered_at'>) => void;
  updateRecurring: (id: string, updates: Partial<RecurringTransaction>) => void;
  deleteRecurring: (id: string) => void;
  checkAndTriggerRecurring: () => void;
}

export const useRecurringStore = create<RecurringState>()(
  persist(
    (set, get) => ({
      recurringTransactions: [],

      addRecurring: (item) => {
        const newItem: RecurringTransaction = {
          ...item,
          id: Math.random().toString(36).substring(2, 9),
        };
        set((state) => ({
          recurringTransactions: [...state.recurringTransactions, newItem],
        }));
      },

      updateRecurring: (id, updates) => {
        set((state) => ({
          recurringTransactions: state.recurringTransactions.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },

      deleteRecurring: (id) => {
        set((state) => ({
          recurringTransactions: state.recurringTransactions.filter((item) => item.id !== id),
        }));
      },

      checkAndTriggerRecurring: () => {
        const today = new Date();
        // Set to midnight UTC-like comparison string
        const todayStr = today.toISOString().split('T')[0];
        const recurringList = get().recurringTransactions;
        let hasChanges = false;

        const updatedList = recurringList.map((item) => {
          if (item.status !== 'active') return item;

          const nextDueDate = new Date(item.next_due_date);
          const itemUpdated = { ...item };

          // Keep triggering if the due date is in the past or today
          while (itemUpdated.next_due_date <= todayStr && itemUpdated.status === 'active') {
            hasChanges = true;

            // Trigger normal transaction creation in useTransactionStore
            const txStore = useTransactionStore.getState();
            txStore.addTransaction({
              type: itemUpdated.type,
              amount: itemUpdated.amount,
              category_id: itemUpdated.category_id,
              wallet_id: itemUpdated.wallet_id,
              note: `${itemUpdated.name} (Berulang)`,
              date: new Date(itemUpdated.next_due_date).toISOString(),
            });

            // Adjust wallets balance
            const walletStore = useWalletStore.getState();
            const wallet = walletStore.wallets.find((w) => w.id === itemUpdated.wallet_id);
            if (wallet) {
              const diff = itemUpdated.type === 'income' ? itemUpdated.amount : -itemUpdated.amount;
              walletStore.updateWallet(itemUpdated.wallet_id, { balance: wallet.balance + diff });
            }

            // Calculate next due date
            if (itemUpdated.frequency === 'daily') {
              nextDueDate.setDate(nextDueDate.getDate() + 1);
            } else if (itemUpdated.frequency === 'weekly') {
              nextDueDate.setDate(nextDueDate.getDate() + 7);
            } else if (itemUpdated.frequency === 'monthly') {
              nextDueDate.setMonth(nextDueDate.getMonth() + 1);
            } else if (itemUpdated.frequency === 'yearly') {
              nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
            }

            itemUpdated.next_due_date = nextDueDate.toISOString().split('T')[0];
            itemUpdated.last_triggered_at = new Date().toISOString();
          }

          return itemUpdated;
        });

        if (hasChanges) {
          set({ recurringTransactions: updatedList });
        }
      },
    }),
    {
      name: 'pundi-recurring-storage',
    }
  )
);

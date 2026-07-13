// ============================================
// Pundi — Transaction Store (Zustand with Sync)
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Transaction, TransactionType, Category } from '@/lib/types';
import { generateId, PRESET_CATEGORIES } from '@/lib/data/presets';
import { getCurrentUserId } from '@/lib/stores/auth-store';

interface TransactionState {
  transactions: Transaction[];
  categories: (Omit<Category, 'id'> & { id: string })[];

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Transaction;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getTransactionsByDate: (start: string, end: string) => Transaction[];
  getTransactionsByWallet: (walletId: string) => Transaction[];
  getTransactionsByType: (type: TransactionType) => Transaction[];
  getCategoryTotals: (start: string, end: string, type: TransactionType) => { category: string; categoryId: string; color: string; icon: string; amount: number; percentage: number }[];
  getTotalByType: (type: TransactionType, start?: string, end?: string) => number;
  addCategory: (cat: Omit<Category, 'id'>) => void;
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      categories: PRESET_CATEGORIES.map((c) => ({ ...c, id: generateId() })),

      addTransaction: (tx) => {
        const newTx: Transaction = {
          ...tx,
          id: generateId(),
          user_id: getCurrentUserId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sourceType: tx.sourceType || 'manual',
          editHistory: [],
        };
        set((state) => ({
          transactions: [newTx, ...state.transactions],
        }));

        return newTx;
      },

      updateTransaction: (id, updates) => {
        const updatedTransactions = get().transactions.map((tx) => {
          if (tx.id !== id) return tx;

          // Track edit history
          const editEntries: Transaction['editHistory'] = [];
          const trackedFields = ['amount', 'category_id', 'wallet_id', 'note', 'date', 'type'] as const;

          for (const field of trackedFields) {
            if (field in updates && updates[field] !== undefined && updates[field] !== tx[field]) {
              editEntries.push({
                field,
                oldValue: tx[field],
                newValue: updates[field],
                editedAt: new Date().toISOString(),
              });
            }
          }

          return {
            ...tx,
            ...updates,
            updated_at: new Date().toISOString(),
            editHistory: [...(tx.editHistory || []), ...editEntries],
          };
        });
        set({ transactions: updatedTransactions });
      },

      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.id !== id),
        }));
      },

      getTransactionsByDate: (start, end) => {
        return get().transactions.filter((tx) => {
          const date = tx.date.split('T')[0];
          return date >= start && date <= end;
        });
      },

      getTransactionsByWallet: (walletId) => {
        return get().transactions.filter(
          (tx) => tx.wallet_id === walletId || tx.target_wallet_id === walletId
        );
      },

      getTransactionsByType: (type) => {
        return get().transactions.filter((tx) => tx.type === type);
      },

      getCategoryTotals: (start, end, type) => {
        const txs = get().transactions.filter((tx) => {
          const date = tx.date.split('T')[0];
          return tx.type === type && date >= start && date <= end;
        });

        const categories = get().categories;
        const totals: Record<string, { categoryId: string; category: string; color: string; icon: string; amount: number }> = {};
        let grandTotal = 0;

        txs.forEach((tx) => {
          const cat = categories.find((c) => c.id === tx.category_id);
          const key = tx.category_id;
          if (!totals[key]) {
            totals[key] = {
              categoryId: key,
              category: cat?.name || 'Lainnya',
              color: cat?.color || '#6B7280',
              icon: cat?.icon || 'DotsThree',
              amount: 0,
            };
          }
          totals[key].amount += tx.amount;
          grandTotal += tx.amount;
        });

        return Object.values(totals)
          .map((t) => ({
            ...t,
            percentage: grandTotal > 0 ? Math.round((t.amount / grandTotal) * 100) : 0,
          }))
          .sort((a, b) => b.amount - a.amount);
      },

      getTotalByType: (type, start, end) => {
        return get()
          .transactions.filter((tx) => {
            if (tx.type !== type) return false;
            if (start && end) {
              const date = tx.date.split('T')[0];
              return date >= start && date <= end;
            }
            return true;
          })
          .reduce((sum, tx) => sum + tx.amount, 0);
      },

      addCategory: (cat) => {
        set((state) => ({
          categories: [...state.categories, { ...cat, id: generateId() }],
        }));
        // Note: For now custom categories stay local only to simplify schema
      },
    }),
    {
      name: 'pundi-transactions',
    }
  )
);

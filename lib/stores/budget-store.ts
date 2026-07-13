// ============================================
// Pundi — Budget Store (Zustand)
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CategoryBudget {
  categoryId: string;
  amount: number; // monthly budget in IDR
}

interface BudgetState {
  budgets: CategoryBudget[];

  // Actions
  setCategoryBudget: (categoryId: string, amount: number) => void;
  getCategoryBudget: (categoryId: string) => number;
  getTotalMonthlyBudget: () => number;
  getTotalWeeklyBudget: () => number;
  getTotalDailyBudget: () => number;
  clearBudgets: () => void;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      budgets: [],

      setCategoryBudget: (categoryId, amount) => {
        set((state) => {
          const exists = state.budgets.some((b) => b.categoryId === categoryId);
          if (exists) {
            return {
              budgets: state.budgets.map((b) =>
                b.categoryId === categoryId ? { ...b, amount } : b
              ),
            };
          } else {
            return {
              budgets: [...state.budgets, { categoryId, amount }],
            };
          }
        });
      },

      getCategoryBudget: (categoryId) => {
        return get().budgets.find((b) => b.categoryId === categoryId)?.amount || 0;
      },

      getTotalMonthlyBudget: () => {
        return get().budgets.reduce((sum, b) => sum + b.amount, 0);
      },

      getTotalWeeklyBudget: () => {
        return Math.round(get().getTotalMonthlyBudget() / 4.33); // More accurate average weeks in month
      },

      getTotalDailyBudget: () => {
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        return Math.round(get().getTotalMonthlyBudget() / daysInMonth);
      },

      clearBudgets: () => set({ budgets: [] }),
    }),
    {
      name: 'pundi-budgets',
    }
  )
);

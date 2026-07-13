// ============================================
// Pundi — Savings Goal Store
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '@/lib/data/presets';

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  walletId?: string;
  iconEmoji: string;
  color: string;
  deadline?: string; // ISO date
  monthlyTarget?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  date: string;
  note?: string;
}

interface GoalState {
  goals: SavingsGoal[];
  contributions: GoalContribution[];

  addGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => SavingsGoal;
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteGoal: (id: string) => void;
  addContribution: (goalId: string, amount: number, note?: string) => void;
  getProgress: (goalId: string) => { percentage: number; remaining: number; estimatedCompletion: string | null };
  getSuggestedMonthlyTarget: (goalId: string) => number;
  getContributionsByGoal: (goalId: string) => GoalContribution[];
}

export const useGoalStore = create<GoalState>()(
  persist(
    (set, get) => ({
      goals: [],
      contributions: [],

      addGoal: (goal) => {
        const newGoal: SavingsGoal = {
          ...goal,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ goals: [...state.goals, newGoal] }));
        return newGoal;
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g
          ),
        }));
      },

      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
          contributions: state.contributions.filter((c) => c.goalId !== id),
        }));
      },

      addContribution: (goalId, amount, note) => {
        const contribution: GoalContribution = {
          id: generateId(),
          goalId,
          amount,
          date: new Date().toISOString(),
          note,
        };
        set((state) => {
          const goal = state.goals.find((g) => g.id === goalId);
          if (!goal) return state;

          return {
            contributions: [contribution, ...state.contributions],
            goals: state.goals.map((g) =>
              g.id === goalId
                ? {
                    ...g,
                    currentAmount: Math.min(g.targetAmount, g.currentAmount + amount),
                    updatedAt: new Date().toISOString(),
                  }
                : g
            ),
          };
        });
      },

      getProgress: (goalId) => {
        const goal = get().goals.find((g) => g.id === goalId);
        if (!goal) return { percentage: 0, remaining: 0, estimatedCompletion: null };

        const percentage = goal.targetAmount > 0
          ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
          : 0;
        const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

        // Estimate completion based on average monthly contributions
        const goalContribs = get().contributions.filter((c) => c.goalId === goalId);
        let estimatedCompletion: string | null = null;

        if (goalContribs.length > 0 && remaining > 0) {
          const firstContrib = new Date(goalContribs[goalContribs.length - 1].date);
          const monthsSince = Math.max(1, (Date.now() - firstContrib.getTime()) / (1000 * 60 * 60 * 24 * 30));
          const avgMonthly = goal.currentAmount / monthsSince;

          if (avgMonthly > 0) {
            const monthsToGo = remaining / avgMonthly;
            const completionDate = new Date();
            completionDate.setMonth(completionDate.getMonth() + Math.ceil(monthsToGo));
            estimatedCompletion = completionDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
          }
        }

        return { percentage, remaining, estimatedCompletion };
      },

      getSuggestedMonthlyTarget: (goalId) => {
        const goal = get().goals.find((g) => g.id === goalId);
        if (!goal || !goal.deadline) return 0;

        const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
        const deadlineDate = new Date(goal.deadline);
        const now = new Date();
        const monthsLeft = Math.max(
          1,
          (deadlineDate.getFullYear() - now.getFullYear()) * 12 + (deadlineDate.getMonth() - now.getMonth())
        );

        return Math.ceil(remaining / monthsLeft);
      },

      getContributionsByGoal: (goalId) => {
        return get().contributions.filter((c) => c.goalId === goalId);
      },
    }),
    { name: 'pundi-goals' }
  )
);

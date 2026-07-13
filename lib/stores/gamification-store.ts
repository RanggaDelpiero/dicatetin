// ============================================
// Pundi — Gamification Store (Zustand)
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProgress } from '@/lib/types';
import { calculateLevel } from '@/lib/gamification/xp';
import { calculateStreak, hasLoggedToday } from '@/lib/gamification/streak';
import { getToday } from '@/lib/utils/date';
import { getCurrentUserId } from '@/lib/stores/auth-store';

interface GamificationState {
  progress: UserProgress;
  showLevelUpModal: boolean;
  newLevel: number | null;

  // Actions
  addXP: (amount: number) => void;
  recordActivity: () => void;
  unlockBadge: (badgeId: string) => void;
  hasBadge: (badgeId: string) => boolean;
  dismissLevelUp: () => void;
}

const initialProgress: UserProgress = {
  id: 'local-progress',
  user_id: getCurrentUserId(),
  xp: 0,
  level: 1,
  streak_days: 0,
  last_activity_date: '',
  badges: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      progress: initialProgress,
      showLevelUpModal: false,
      newLevel: null,

      addXP: (amount) => {
        set((state) => {
          const newXP = state.progress.xp + amount;
          const oldLevel = state.progress.level;
          const newLevel = calculateLevel(newXP);
          const leveledUp = newLevel > oldLevel;

          return {
            progress: {
              ...state.progress,
              xp: newXP,
              level: newLevel,
              updated_at: new Date().toISOString(),
            },
            showLevelUpModal: leveledUp,
            newLevel: leveledUp ? newLevel : state.newLevel,
          };
        });
      },

      recordActivity: () => {
        set((state) => {
          const today = getToday();
          if (hasLoggedToday(state.progress.last_activity_date)) {
            return state; // Already logged today
          }

          const newStreak = calculateStreak(
            state.progress.streak_days,
            state.progress.last_activity_date
          );

          return {
            progress: {
              ...state.progress,
              streak_days: newStreak,
              last_activity_date: today,
              updated_at: new Date().toISOString(),
            },
          };
        });
      },

      unlockBadge: (badgeId) => {
        set((state) => {
          if (state.progress.badges.includes(badgeId)) return state;
          return {
            progress: {
              ...state.progress,
              badges: [...state.progress.badges, badgeId],
              updated_at: new Date().toISOString(),
            },
          };
        });
      },

      hasBadge: (badgeId) => {
        return get().progress.badges.includes(badgeId);
      },

      dismissLevelUp: () => {
        set({ showLevelUpModal: false, newLevel: null });
      },
    }),
    {
      name: 'pundi-gamification',
    }
  )
);

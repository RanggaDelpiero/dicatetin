// ============================================
// Pundi — Auth Store (Zustand)
// ============================================

import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  setUser: (user: User | null, session: Session | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  setUser: (user, session) => set({ user, session }),
}));

export const getCurrentUserId = () => {
  return useAuthStore.getState().user?.id || 'local-user';
};

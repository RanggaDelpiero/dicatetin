// ============================================
// Pundi — AI Advisor Chat Store
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AdvisorMessage } from '@/lib/types';
import { generateId } from '@/lib/data/presets';

interface AdvisorState {
  messages: AdvisorMessage[];
  isLoading: boolean;

  addUserMessage: (content: string) => AdvisorMessage;
  addAssistantMessage: (content: string) => AdvisorMessage;
  setLoading: (loading: boolean) => void;
  clearHistory: () => void;
}

export const useAdvisorStore = create<AdvisorState>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,

      addUserMessage: (content) => {
        const msg: AdvisorMessage = {
          id: generateId(),
          role: 'user',
          content,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({ messages: [...state.messages, msg] }));
        return msg;
      },

      addAssistantMessage: (content) => {
        const msg: AdvisorMessage = {
          id: generateId(),
          role: 'assistant',
          content,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({ messages: [...state.messages, msg] }));
        return msg;
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      clearHistory: () => {
        set({ messages: [], isLoading: false });
      },
    }),
    {
      name: 'pundi-advisor',
      partialize: (state) => ({ messages: state.messages }), // Don't persist loading state
    }
  )
);

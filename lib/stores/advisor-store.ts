// ============================================
// Pundi — AI Advisor Chat Store
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AdvisorMessage } from '@/lib/types';
import { generateId } from '@/lib/data/presets';

export interface FinancialReport {
  healthScore: number;
  summary: string;
  breakdown: {
    title: string;
    desc: string;
    status: 'good' | 'warning' | 'neutral';
  }[];
  recommendations: string[];
  lastGeneratedAt: string;
}

interface AdvisorState {
  messages: AdvisorMessage[];
  isLoading: boolean;
  report: FinancialReport | null;
  isReportLoading: boolean;

  addUserMessage: (content: string) => AdvisorMessage;
  addAssistantMessage: (content: string) => AdvisorMessage;
  setLoading: (loading: boolean) => void;
  clearHistory: () => void;
  setReport: (report: FinancialReport | null) => void;
  setReportLoading: (loading: boolean) => void;
}

export const useAdvisorStore = create<AdvisorState>()(
  persist(
    (set) => ({
      messages: [],
      isLoading: false,
      report: null,
      isReportLoading: false,

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
        set({ messages: [], isLoading: false, report: null });
      },

      setReport: (report) => {
        set({ report });
      },

      setReportLoading: (isReportLoading) => {
        set({ isReportLoading });
      },
    }),
    {
      name: 'pundi-advisor',
      partialize: (state) => ({ messages: state.messages, report: state.report }), // Persist chat history and generated report
    }
  )
);

// ============================================
// Pundi — Intelligence Store
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIInsight, FinancialAlert, AIActionSuggestion, AIReviewResponse } from '@/lib/ai/schemas';

interface AcceptedSuggestion {
  id: string;
  insightId: string;
  action: AIActionSuggestion;
  acceptedAt: string;
}

export interface ReviewReport {
  id: string;
  periodKey: string; // e.g. "week:2026-W28" or "month:2026-07"
  content: AIReviewResponse;
  createdAt: string;
}

interface IntelligenceState {
  insights: AIInsight[];
  alerts: FinancialAlert[];
  reports: ReviewReport[];
  acceptedSuggestions: AcceptedSuggestion[];

  // Actions
  addInsight: (insight: Omit<AIInsight, 'id' | 'createdAt'>) => AIInsight;
  dismissInsight: (id: string) => void;
  acceptInsight: (id: string, action: AIActionSuggestion) => void;
  getActiveInsights: () => AIInsight[];
  syncInsights: (newInsights: AIInsight[]) => void;
  setInsights: (insights: AIInsight[]) => void;

  addAlert: (alert: Omit<FinancialAlert, 'id' | 'createdAt'>) => void;
  markAlertRead: (id: string) => void;
  getActiveAlerts: () => FinancialAlert[];

  saveReport: (periodKey: string, content: AIReviewResponse) => void;
  getReport: (periodKey: string) => ReviewReport | undefined;
}

export const useIntelligenceStore = create<IntelligenceState>()(
  persist(
    (set, get) => ({
      insights: [],
      alerts: [],
      reports: [],
      acceptedSuggestions: [],

      addInsight: (insight) => {
        const newInsight: AIInsight = {
          ...insight,
          id: `ins_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ insights: [newInsight, ...state.insights] }));
        return newInsight;
      },

      dismissInsight: (id) => {
        set((state) => ({
          insights: state.insights.map((ins) =>
            ins.id === id ? { ...ins, dismissedAt: new Date().toISOString() } : ins
          ),
        }));
      },

      acceptInsight: (id, action) => {
        set((state) => ({
          insights: state.insights.map((ins) =>
            ins.id === id ? { ...ins, acceptedAt: new Date().toISOString() } : ins
          ),
          acceptedSuggestions: [
            {
              id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              insightId: id,
              action,
              acceptedAt: new Date().toISOString(),
            },
            ...state.acceptedSuggestions,
          ],
        }));
      },

      getActiveInsights: () => {
        return get().insights.filter((ins) => !ins.dismissedAt && !ins.acceptedAt);
      },

      syncInsights: (newInsights) => {
        const state = get();
        const activeCurrent = state.getActiveInsights();
        const pastInsights = state.insights;
        
        const insightsToAdd: AIInsight[] = [];
        
        for (const newIns of newInsights) {
          // Check if we already have this specific insight (by kind and dataSignature)
          const existing = pastInsights.find(
            (p) => p.kind === newIns.kind && p.dataSignature === newIns.dataSignature
          );
          
          if (!existing) {
            // New signature = new insight, even if we dismissed an old one of the same kind
            insightsToAdd.push({
              ...newIns,
              id: newIns.id || `ins_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              createdAt: newIns.createdAt || new Date().toISOString(),
            });
          }
        }

        // We want to replace current active ones that are no longer valid, 
        // but keep past dismissed/accepted history
        const activeCurrentToKeep = activeCurrent.filter((curr) => 
          newInsights.some((n) => n.kind === curr.kind && n.dataSignature === curr.dataSignature)
        );

        const history = pastInsights.filter((p) => p.dismissedAt || p.acceptedAt);

        set({
          insights: [...insightsToAdd, ...activeCurrentToKeep, ...history],
        });
      },

      setInsights: (insights) => set({ insights }),

      addAlert: (alert) => {
        set((state) => ({
          alerts: [
            {
              ...alert,
              id: `alt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              createdAt: new Date().toISOString(),
            },
            ...state.alerts,
          ],
        }));
      },

      markAlertRead: (id) => {
        set((state) => ({
          alerts: state.alerts.map((alt) =>
            alt.id === id ? { ...alt, readAt: new Date().toISOString() } : alt
          ),
        }));
      },

      getActiveAlerts: () => {
        return get().alerts.filter((alt) => !alt.readAt);
      },

      saveReport: (periodKey, content) => {
        set((state) => ({
          reports: [
            {
              id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              periodKey,
              content,
              createdAt: new Date().toISOString(),
            },
            ...state.reports.filter((r) => r.periodKey !== periodKey), // replace old report for same period
          ],
        }));
      },

      getReport: (periodKey) => {
        return get().reports.find((r) => r.periodKey === periodKey);
      },
    }),
    { name: 'pundi-intelligence' }
  )
);

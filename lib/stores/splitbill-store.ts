// ============================================
// Pundi — Split Bill Store
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SplitBillSession, SplitParticipant, SplitMethod } from '@/lib/types';
import { generateId } from '@/lib/data/presets';

interface SplitBillState {
  sessions: SplitBillSession[];

  addSession: (session: {
    title: string;
    total_amount: number;
    method: SplitMethod;
    participantNames: string[];
    customAmounts?: Record<string, number>;
  }) => SplitBillSession;
  deleteSession: (id: string) => void;
  markParticipantPaid: (sessionId: string, participantId: string) => void;
  getSession: (id: string) => SplitBillSession | undefined;
}

export const useSplitBillStore = create<SplitBillState>()(
  persist(
    (set, get) => ({
      sessions: [],

      addSession: ({ title, total_amount, method, participantNames, customAmounts }) => {
        const sessionId = generateId();
        const perPerson = Math.ceil(total_amount / participantNames.length);

        const participants: SplitParticipant[] = participantNames.map((name) => ({
          id: generateId(),
          session_id: sessionId,
          name,
          amount: method === 'custom' && customAmounts?.[name] ? customAmounts[name] : perPerson,
          status: 'unpaid' as const,
        }));

        const session: SplitBillSession = {
          id: sessionId,
          user_id: 'local-user',
          title,
          total_amount,
          method,
          participants,
          created_at: new Date().toISOString(),
        };

        set((state) => ({ sessions: [session, ...state.sessions] }));
        return session;
      },

      deleteSession: (id) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
        }));
      },

      markParticipantPaid: (sessionId, participantId) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  participants: s.participants.map((p) =>
                    p.id === participantId ? { ...p, status: 'paid' as const } : p
                  ),
                }
              : s
          ),
        }));
      },

      getSession: (id) => {
        return get().sessions.find((s) => s.id === id);
      },
    }),
    { name: 'pundi-splitbill' }
  )
);

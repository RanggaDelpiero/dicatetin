// ============================================
// Pundi — Split Bill Store
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SplitBillSession, SplitBillItem, SplitParticipant, SplitMethod } from '@/lib/types';
import { generateId } from '@/lib/data/presets';
import { useSyncStore } from '@/lib/stores/sync-store';

interface SplitBillState {
  sessions: SplitBillSession[];

  addSession: (session: {
    title: string;
    total_amount: number;
    method: SplitMethod;
    participantNames: string[];
    items?: SplitBillItem[];
    paidBy: string;
    customAmounts?: Record<string, number>;
  }) => SplitBillSession;
  deleteSession: (id: string) => void;
  markParticipantPaid: (sessionId: string, participantId: string) => void;
  getSession: (id: string) => SplitBillSession | undefined;
}

/**
 * Calculate each participant's share based on items assigned to them.
 * If an item is assigned to multiple people, the cost is split equally among them.
 */
function calculatePerItemAmounts(
  items: SplitBillItem[],
  participantNames: string[]
): Record<string, number> {
  const amounts: Record<string, number> = {};
  participantNames.forEach((name) => {
    amounts[name] = 0;
  });

  items.forEach((item) => {
    if (item.assignedTo.length === 0) return;
    const itemTotal = item.price * item.qty;
    const perPerson = Math.round(itemTotal / item.assignedTo.length);
    item.assignedTo.forEach((name) => {
      if (amounts[name] !== undefined) {
        amounts[name] += perPerson;
      }
    });
  });

  return amounts;
}

export const useSplitBillStore = create<SplitBillState>()(
  persist(
    (set, get) => ({
      sessions: [],

      addSession: ({ title, total_amount, method, participantNames, items = [], paidBy, customAmounts }) => {
        const sessionId = generateId();

        // Calculate per-person amounts based on method
        let perPersonAmounts: Record<string, number> = {};

        if (method === 'per-item' && items.length > 0) {
          perPersonAmounts = calculatePerItemAmounts(items, participantNames);
        } else if (method === 'custom' && customAmounts) {
          participantNames.forEach((name) => {
            perPersonAmounts[name] = customAmounts[name] || 0;
          });
        } else {
          // equal split
          const perPerson = Math.ceil(total_amount / participantNames.length);
          participantNames.forEach((name) => {
            perPersonAmounts[name] = perPerson;
          });
        }

        const participants: SplitParticipant[] = participantNames.map((name) => ({
          id: generateId(),
          session_id: sessionId,
          name,
          amount: perPersonAmounts[name] || 0,
          status: 'unpaid' as const,
        }));

        const session: SplitBillSession = {
          id: sessionId,
          user_id: 'local-user',
          title,
          total_amount,
          method,
          participants,
          items,
          paidBy,
          created_at: new Date().toISOString(),
        };

        set((state) => ({ sessions: [session, ...state.sessions] }));

        // Split Bill synchronization
        // To simplify, we're passing the whole session (including JSON items). Ensure schema is capable, or adapt as needed.
        useSyncStore.getState().addToQueue({
           table: 'split_bill_sessions',
           action: 'insert',
           payload: {
              id: session.id,
              user_id: session.user_id,
              title: session.title,
              total_amount: session.total_amount,
              method: session.method,
              created_at: session.created_at,
           },
        });

        participants.forEach(p => {
           useSyncStore.getState().addToQueue({
              table: 'split_participants',
              action: 'insert',
              payload: p,
           });
        });

        return session;
      },

      deleteSession: (id) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
        }));

        useSyncStore.getState().addToQueue({
          table: 'split_bill_sessions',
          action: 'delete',
          payload: { id },
        });
      },

      markParticipantPaid: (sessionId, participantId) => {
        let updatedParticipant: SplitParticipant | undefined;
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id === sessionId) {
              const newParticipants = s.participants.map((p) => {
                if (p.id === participantId) {
                  updatedParticipant = { ...p, status: 'paid' as const };
                  return updatedParticipant;
                }
                return p;
              });
              return { ...s, participants: newParticipants };
            }
            return s;
          }),
        }));

        if (updatedParticipant) {
           useSyncStore.getState().addToQueue({
             table: 'split_participants',
             action: 'update',
             payload: updatedParticipant,
           });
        }
      },

      getSession: (id) => {
        return get().sessions.find((s) => s.id === id);
      },
    }),
    { name: 'pundi-splitbill' }
  )
);

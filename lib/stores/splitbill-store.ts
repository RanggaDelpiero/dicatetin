// ============================================
// Pundi — Split Bill Store
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SplitBillSession, SplitBillItem, SplitParticipant, SplitMethod } from '@/lib/types';
import { generateId } from '@/lib/data/presets';

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
    tax?: number;
    service?: number;
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

      addSession: ({ title, total_amount, method, participantNames, items = [], paidBy, customAmounts, tax = 0, service = 0 }) => {
        const sessionId = generateId();

        // Calculate per-person amounts based on method
        let perPersonAmounts: Record<string, number> = {};

        if (method === 'per-item' && items.length > 0) {
          perPersonAmounts = calculatePerItemAmounts(items, participantNames);
          
          // Proportional tax and service calculation!
          const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
          if (subtotal > 0) {
            participantNames.forEach((name) => {
              const personalSubtotal = perPersonAmounts[name] || 0;
              const personalTax = Math.round((personalSubtotal / subtotal) * tax);
              const personalService = Math.round((personalSubtotal / subtotal) * service);
              perPersonAmounts[name] = personalSubtotal + personalTax + personalService;
            });
          }
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
          tax,
          service,
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

// ============================================
// Pundi — Notification Store
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '@/lib/data/presets';
import { useDebtStore } from './debt-store';
import { useReceivableStore } from './receivable-store';
import { useRecurringStore } from './recurring-store';
import { useBudgetStore } from './budget-store';
import { useTransactionStore } from './transaction-store';
import { useGamificationStore } from './gamification-store';

export type NotificationType =
  | 'debt_due'
  | 'recurring_upcoming'
  | 'streak_risk'
  | 'budget_warning'
  | 'receivable_followup';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl: string;
  createdAt: string;
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
  referenceId?: string; // ID of the related entity
}

interface NotificationState {
  notifications: AppNotification[];
  lastGeneratedAt: string | null;

  // Actions
  generateNotifications: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      lastGeneratedAt: null,

      generateNotifications: () => {
        const newNotifs: AppNotification[] = [];
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // 1. Due debts — within 3 days or overdue
        const debts = useDebtStore.getState().getActiveDebts();
        debts.forEach((debt) => {
          if (!debt.due_date) return;
          const dueDate = new Date(debt.due_date);
          const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          if (daysUntilDue <= 3) {
            newNotifs.push({
              id: generateId(),
              type: 'debt_due',
              title: daysUntilDue < 0
                ? `⚠️ Hutang telat ${Math.abs(daysUntilDue)} hari!`
                : daysUntilDue === 0
                ? '🔔 Hutang jatuh tempo hari ini!'
                : `📅 Hutang jatuh tempo ${daysUntilDue} hari lagi`,
              body: `${debt.creditor} — sisa Rp${debt.remaining_amount.toLocaleString('id-ID')}`,
              actionUrl: '/debts',
              createdAt: new Date().toISOString(),
              isRead: false,
              priority: daysUntilDue <= 0 ? 'high' : 'medium',
              referenceId: debt.id,
            });
          }
        });

        // 2. Recurring transactions — due within 1 day
        const recurring = useRecurringStore.getState().recurringTransactions;
        recurring
          .filter((r) => r.status === 'active')
          .forEach((r) => {
            const nextDue = new Date(r.next_due_date);
            const daysUntil = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (daysUntil <= 1 && daysUntil >= 0) {
              newNotifs.push({
                id: generateId(),
                type: 'recurring_upcoming',
                title: daysUntil === 0
                  ? '🔄 Transaksi berulang hari ini'
                  : '🔄 Transaksi berulang besok',
                body: `${r.name} — Rp${r.amount.toLocaleString('id-ID')}`,
                actionUrl: '/transactions/recurring',
                createdAt: new Date().toISOString(),
                isRead: false,
                priority: 'medium',
                referenceId: r.id,
              });
            }
          });

        // 3. Streak risk — if last activity was yesterday and no tx today
        const progress = useGamificationStore.getState().progress;
        if (progress.streak_days > 0 && progress.last_activity_date) {
          const lastActive = new Date(progress.last_activity_date);
          const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays >= 1) {
            const hasTxToday = useTransactionStore.getState().transactions.some(
              (tx) => tx.date.split('T')[0] === todayStr
            );

            if (!hasTxToday) {
              newNotifs.push({
                id: generateId(),
                type: 'streak_risk',
                title: `🔥 Streak ${progress.streak_days} hari mau putus!`,
                body: 'Catat minimal 1 transaksi hari ini biar streak gak reset.',
                actionUrl: '/dashboard',
                createdAt: new Date().toISOString(),
                isRead: false,
                priority: 'high',
              });
            }
          }
        }

        // 4. Budget warning — any category >85% spent today
        const budgets = useBudgetStore.getState().budgets;
        if (budgets.length > 0) {
          const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
          const txToday = useTransactionStore.getState().transactions.filter(
            (tx) => tx.type === 'expense' && tx.date.split('T')[0] === todayStr
          );

          budgets.forEach((budget) => {
            const dailyLimit = Math.round(budget.amount / daysInMonth);
            const spent = txToday
              .filter((tx) => tx.category_id === budget.categoryId)
              .reduce((sum, tx) => sum + tx.amount, 0);
            const pct = dailyLimit > 0 ? (spent / dailyLimit) * 100 : 0;

            if (pct >= 85) {
              newNotifs.push({
                id: generateId(),
                type: 'budget_warning',
                title: pct >= 100
                  ? '🚨 Budget harian habis!'
                  : '💰 Budget hampir habis',
                body: `${budget.categoryId} — ${Math.round(pct)}% terpakai hari ini`,
                actionUrl: '/dashboard',
                createdAt: new Date().toISOString(),
                isRead: false,
                priority: pct >= 100 ? 'high' : 'medium',
                referenceId: budget.categoryId,
              });
            }
          });
        }

        // 5. Receivable follow-up — unpaid receivables older than 7 days
        const receivables = useReceivableStore.getState().getActiveReceivables();
        receivables.forEach((rec) => {
          const createdDate = new Date(rec.created_at);
          const daysSince = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

          if (daysSince >= 7) {
            newNotifs.push({
              id: generateId(),
              type: 'receivable_followup',
              title: '📩 Ingetin piutang yuk',
              body: `${rec.debtor} — Rp${rec.remaining_amount.toLocaleString('id-ID')} (${daysSince} hari)`,
              actionUrl: '/debts',
              createdAt: new Date().toISOString(),
              isRead: false,
              priority: 'low',
              referenceId: rec.id,
            });
          }
        });

        // Deduplicate by referenceId + type (keep existing read status)
        const existingMap = new Map(
          get().notifications.map((n) => [`${n.type}-${n.referenceId || ''}`, n])
        );

        const mergedNotifs = newNotifs.map((n) => {
          const key = `${n.type}-${n.referenceId || ''}`;
          const existing = existingMap.get(key);
          if (existing) {
            return { ...n, isRead: existing.isRead };
          }
          return n;
        });

        set({
          notifications: mergedNotifs,
          lastGeneratedAt: new Date().toISOString(),
        });
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        }));
      },

      clearAll: () => set({ notifications: [] }),

      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.isRead).length;
      },
    }),
    {
      name: 'pundi-notifications',
    }
  )
);

// ============================================
// Pundi — Data Backup Store
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useTransactionStore } from './transaction-store';
import { useWalletStore } from './wallet-store';
import { useDebtStore } from './debt-store';
import { useReceivableStore } from './receivable-store';
import { useSplitBillStore } from './splitbill-store';
import { useBudgetStore } from './budget-store';
import { useGamificationStore } from './gamification-store';
import { useAdvisorStore } from './advisor-store';
import { useRecurringStore } from './recurring-store';

export interface BackupData {
  version: number;
  exportedAt: string;
  appVersion: string;
  data: {
    transactions: unknown;
    categories: unknown;
    wallets: unknown;
    debts: unknown;
    debtPayments: unknown;
    receivables: unknown;
    receivablePayments: unknown;
    splitBillSessions: unknown;
    budgets: unknown;
    gamification: unknown;
    advisor: unknown;
    recurring: unknown;
  };
}

interface BackupState {
  lastBackupDate: string | null;
  backupReminderEnabled: boolean;
  backupReminderIntervalDays: number;

  // Actions
  setLastBackupDate: (date: string) => void;
  setBackupReminder: (enabled: boolean, intervalDays?: number) => void;
  exportAllData: () => BackupData;
  importData: (backup: BackupData, mode: 'replace' | 'merge') => { success: boolean; message: string; counts: Record<string, number> };
  validateImport: (data: unknown) => { valid: boolean; errors: string[] };
  shouldRemindBackup: () => boolean;
}

const CURRENT_VERSION = 1;
const APP_VERSION = '0.1.0';

export const useBackupStore = create<BackupState>()(
  persist(
    (set, get) => ({
      lastBackupDate: null,
      backupReminderEnabled: true,
      backupReminderIntervalDays: 7,

      setLastBackupDate: (date) => set({ lastBackupDate: date }),

      setBackupReminder: (enabled, intervalDays) =>
        set({
          backupReminderEnabled: enabled,
          ...(intervalDays !== undefined ? { backupReminderIntervalDays: intervalDays } : {}),
        }),

      shouldRemindBackup: () => {
        const { lastBackupDate, backupReminderEnabled, backupReminderIntervalDays } = get();
        if (!backupReminderEnabled) return false;
        if (!lastBackupDate) return true; // Never backed up

        const lastDate = new Date(lastBackupDate);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= backupReminderIntervalDays;
      },

      exportAllData: () => {
        const txState = useTransactionStore.getState();
        const walletState = useWalletStore.getState();
        const debtState = useDebtStore.getState();
        const recState = useReceivableStore.getState();
        const splitState = useSplitBillStore.getState();
        const budgetState = useBudgetStore.getState();
        const gamState = useGamificationStore.getState();
        const advState = useAdvisorStore.getState();
        const recurState = useRecurringStore.getState();

        const backup: BackupData = {
          version: CURRENT_VERSION,
          exportedAt: new Date().toISOString(),
          appVersion: APP_VERSION,
          data: {
            transactions: txState.transactions,
            categories: txState.categories,
            wallets: walletState.wallets,
            debts: debtState.debts,
            debtPayments: debtState.payments,
            receivables: recState.receivables,
            receivablePayments: recState.payments,
            splitBillSessions: splitState.sessions,
            budgets: budgetState.budgets,
            gamification: gamState.progress,
            advisor: advState.messages,
            recurring: recurState.recurringTransactions,
          },
        };

        // Update last backup date
        set({ lastBackupDate: new Date().toISOString() });

        return backup;
      },

      validateImport: (data: unknown): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (!data || typeof data !== 'object') {
          errors.push('Data bukan object yang valid');
          return { valid: false, errors };
        }

        const backup = data as Record<string, unknown>;

        if (typeof backup.version !== 'number') {
          errors.push('Versi backup tidak ditemukan');
        }

        if (!backup.exportedAt || typeof backup.exportedAt !== 'string') {
          errors.push('Tanggal export tidak ditemukan');
        }

        if (!backup.data || typeof backup.data !== 'object') {
          errors.push('Data backup kosong atau format salah');
          return { valid: false, errors };
        }

        const d = backup.data as Record<string, unknown>;

        if (!Array.isArray(d.transactions)) errors.push('Data transaksi tidak valid');
        if (!Array.isArray(d.wallets)) errors.push('Data wallet tidak valid');

        return { valid: errors.length === 0, errors };
      },

      importData: (backup, mode) => {
        const counts: Record<string, number> = {};

        try {
          const d = backup.data;

          if (mode === 'replace') {
            // Full replace — clear and set new data
            if (Array.isArray(d.transactions)) {
              useTransactionStore.setState({
                transactions: d.transactions as never[],
                ...(Array.isArray(d.categories) ? { categories: d.categories as never[] } : {}),
              });
              counts.transactions = (d.transactions as unknown[]).length;
            }

            if (Array.isArray(d.wallets)) {
              useWalletStore.setState({ wallets: d.wallets as never[] });
              counts.wallets = (d.wallets as unknown[]).length;
            }

            if (Array.isArray(d.debts)) {
              useDebtStore.setState({
                debts: d.debts as never[],
                payments: Array.isArray(d.debtPayments) ? (d.debtPayments as never[]) : [],
              });
              counts.debts = (d.debts as unknown[]).length;
            }

            if (Array.isArray(d.receivables)) {
              useReceivableStore.setState({
                receivables: d.receivables as never[],
                payments: Array.isArray(d.receivablePayments) ? (d.receivablePayments as never[]) : [],
              });
              counts.receivables = (d.receivables as unknown[]).length;
            }

            if (Array.isArray(d.splitBillSessions)) {
              useSplitBillStore.setState({ sessions: d.splitBillSessions as never[] });
              counts.splitBills = (d.splitBillSessions as unknown[]).length;
            }

            if (Array.isArray(d.budgets)) {
              useBudgetStore.setState({ budgets: d.budgets as never[] });
              counts.budgets = (d.budgets as unknown[]).length;
            }

            if (d.gamification && typeof d.gamification === 'object') {
              useGamificationStore.setState({ progress: d.gamification as never });
              counts.gamification = 1;
            }

            if (Array.isArray(d.advisor)) {
              useAdvisorStore.setState({ messages: d.advisor as never[] });
              counts.advisorMessages = (d.advisor as unknown[]).length;
            }

            if (Array.isArray(d.recurring)) {
              useRecurringStore.setState({ recurringTransactions: d.recurring as never[] });
              counts.recurring = (d.recurring as unknown[]).length;
            }
          } else {
            // Merge — append non-duplicate items
            if (Array.isArray(d.transactions)) {
              const existing = useTransactionStore.getState().transactions;
              const existingIds = new Set(existing.map((t) => t.id));
              const newTxs = (d.transactions as Array<{ id: string }>).filter((t) => !existingIds.has(t.id));
              useTransactionStore.setState({ transactions: [...existing, ...newTxs] as never[] });
              counts.transactions = newTxs.length;
            }

            if (Array.isArray(d.wallets)) {
              const existing = useWalletStore.getState().wallets;
              const existingIds = new Set(existing.map((w) => w.id));
              const newWallets = (d.wallets as Array<{ id: string }>).filter((w) => !existingIds.has(w.id));
              useWalletStore.setState({ wallets: [...existing, ...newWallets] as never[] });
              counts.wallets = newWallets.length;
            }

            if (Array.isArray(d.debts)) {
              const existing = useDebtStore.getState().debts;
              const existingIds = new Set(existing.map((x) => x.id));
              const newItems = (d.debts as Array<{ id: string }>).filter((x) => !existingIds.has(x.id));
              useDebtStore.setState({ debts: [...existing, ...newItems] as never[] });
              counts.debts = newItems.length;
            }

            if (Array.isArray(d.receivables)) {
              const existing = useReceivableStore.getState().receivables;
              const existingIds = new Set(existing.map((x) => x.id));
              const newItems = (d.receivables as Array<{ id: string }>).filter((x) => !existingIds.has(x.id));
              useReceivableStore.setState({ receivables: [...existing, ...newItems] as never[] });
              counts.receivables = newItems.length;
            }

            if (Array.isArray(d.splitBillSessions)) {
              const existing = useSplitBillStore.getState().sessions;
              const existingIds = new Set(existing.map((x) => x.id));
              const newItems = (d.splitBillSessions as Array<{ id: string }>).filter((x) => !existingIds.has(x.id));
              useSplitBillStore.setState({ sessions: [...existing, ...newItems] as never[] });
              counts.splitBills = newItems.length;
            }

            if (Array.isArray(d.recurring)) {
              const existing = useRecurringStore.getState().recurringTransactions;
              const existingIds = new Set(existing.map((x) => x.id));
              const newItems = (d.recurring as Array<{ id: string }>).filter((x) => !existingIds.has(x.id));
              useRecurringStore.setState({ recurringTransactions: [...existing, ...newItems] as never[] });
              counts.recurring = newItems.length;
            }
          }

          return { success: true, message: 'Import berhasil! 🎉', counts };
        } catch (err) {
          console.error('[Backup] Import failed:', err);
          return { success: false, message: 'Gagal import data. Format file mungkin rusak.', counts };
        }
      },
    }),
    {
      name: 'pundi-backup',
    }
  )
);

// ============================================
// Pundi — Wallet Store (Zustand with Sync)
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Wallet, WalletType } from '@/lib/types';
import { generateId } from '@/lib/data/presets';
import { getCurrentUserId } from '@/lib/stores/auth-store';

interface WalletState {
  wallets: Wallet[];

  // Actions
  addWallet: (wallet: { 
    name: string; 
    type: WalletType; 
    balance: number; 
    color: string; 
    icon: string;
    credit_limit?: number;
    credit_outstanding?: number;
    credit_statement_label?: string;
    credit_due_date?: string;
    credit_minimum_payment?: number;
  }) => Wallet;
  updateWallet: (id: string, updates: Partial<Wallet>) => void;
  deleteWallet: (id: string) => void;
  updateBalance: (id: string, delta: number) => void;
  payCreditCardBill: (params: { creditCardWalletId: string; sourceWalletId: string; amount: number; }) => void;
  getTotalBalance: () => number;
  getWalletById: (id: string) => Wallet | undefined;
}

const DEFAULT_WALLETS: Wallet[] = [
  {
    id: 'wallet-cash',
    user_id: getCurrentUserId(),
    name: 'Cash',
    type: 'cash',
    balance: 500000,
    color: '#22C55E',
    icon: 'Money',
    order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'wallet-bca',
    user_id: getCurrentUserId(),
    name: 'Bank BCA',
    type: 'bank',
    balance: 3500000,
    color: '#3B82F6',
    icon: 'Bank',
    order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'wallet-gopay',
    user_id: getCurrentUserId(),
    name: 'GoPay',
    type: 'ewallet',
    balance: 250000,
    color: '#00AED6',
    icon: 'DeviceMobile',
    order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallets: DEFAULT_WALLETS,

      addWallet: (wallet) => {
        const newWallet: Wallet = {
          ...wallet,
          id: generateId(),
          user_id: getCurrentUserId(),
          order: get().wallets.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((state) => ({
          wallets: [...state.wallets, newWallet],
        }));

        return newWallet;
      },

      updateWallet: (id, updates) => {
        const updatedWallets = get().wallets.map((w) =>
          w.id === id ? { ...w, ...updates, updated_at: new Date().toISOString() } : w
        );
        set({ wallets: updatedWallets });
      },

      deleteWallet: (id) => {
        set((state) => ({
          wallets: state.wallets.filter((w) => w.id !== id),
        }));
      },

      updateBalance: (id, delta) => {
        const updatedWallets = get().wallets.map((w) =>
          w.id === id
            ? { ...w, balance: w.balance + delta, updated_at: new Date().toISOString() }
            : w
        );
        set({ wallets: updatedWallets });
      },

      payCreditCardBill: ({ creditCardWalletId, sourceWalletId, amount }) => {
        const wallets = get().wallets;
        const sourceWallet = wallets.find(w => w.id === sourceWalletId);
        const ccWallet = wallets.find(w => w.id === creditCardWalletId);
        
        if (!sourceWallet || !ccWallet || ccWallet.type !== 'credit_card') return;

        const updatedWallets = wallets.map(w => {
          if (w.id === sourceWalletId) {
            return { ...w, balance: w.balance - amount, updated_at: new Date().toISOString() };
          }
          if (w.id === creditCardWalletId) {
            const newOutstanding = Math.max(0, (w.credit_outstanding || 0) - amount);
            return { ...w, credit_outstanding: newOutstanding, updated_at: new Date().toISOString() };
          }
          return w;
        });

        set({ wallets: updatedWallets });
      },

      getTotalBalance: () => {
        return get().wallets
          .filter(w => w.type !== 'credit_card')
          .reduce((sum, w) => sum + w.balance, 0);
      },

      getWalletById: (id) => {
        return get().wallets.find((w) => w.id === id);
      },
    }),
    {
      name: 'pundi-wallets',
    }
  )
);

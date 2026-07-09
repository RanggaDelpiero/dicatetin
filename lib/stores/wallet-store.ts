// ============================================
// Pundi — Wallet Store (Zustand)
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Wallet, WalletType } from '@/lib/types';
import { generateId } from '@/lib/data/presets';

interface WalletState {
  wallets: Wallet[];

  // Actions
  addWallet: (wallet: { name: string; type: WalletType; balance: number; color: string; icon: string }) => Wallet;
  updateWallet: (id: string, updates: Partial<Wallet>) => void;
  deleteWallet: (id: string) => void;
  updateBalance: (id: string, delta: number) => void;
  getTotalBalance: () => number;
  getWalletById: (id: string) => Wallet | undefined;
}

// Initialize with default wallets
const DEFAULT_WALLETS: Wallet[] = [
  {
    id: 'wallet-cash',
    user_id: 'local-user',
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
    user_id: 'local-user',
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
    user_id: 'local-user',
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
          user_id: 'local-user',
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
        set((state) => ({
          wallets: state.wallets.map((w) =>
            w.id === id ? { ...w, ...updates, updated_at: new Date().toISOString() } : w
          ),
        }));
      },

      deleteWallet: (id) => {
        set((state) => ({
          wallets: state.wallets.filter((w) => w.id !== id),
        }));
      },

      updateBalance: (id, delta) => {
        set((state) => ({
          wallets: state.wallets.map((w) =>
            w.id === id
              ? { ...w, balance: w.balance + delta, updated_at: new Date().toISOString() }
              : w
          ),
        }));
      },

      getTotalBalance: () => {
        return get().wallets.reduce((sum, w) => sum + w.balance, 0);
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

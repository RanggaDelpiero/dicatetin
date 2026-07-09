// ============================================
// Pundi — Badge/Achievement System
// ============================================

import { Badge } from '@/lib/types';

export const BADGES: Badge[] = [
  {
    id: 'first-transaction',
    name: 'Langkah Pertama',
    description: 'Catat transaksi pertamamu',
    icon: 'Footprints',
    condition: 'Record first transaction',
    xp_reward: 20,
  },
  {
    id: 'streak-7',
    name: '7 Hari Beruntun',
    description: 'Catat transaksi 7 hari berturut-turut',
    icon: 'Fire',
    condition: 'Maintain 7-day streak',
    xp_reward: 50,
  },
  {
    id: 'streak-30',
    name: 'Sebulan Penuh',
    description: 'Catat transaksi 30 hari berturut-turut',
    icon: 'Trophy',
    condition: 'Maintain 30-day streak',
    xp_reward: 150,
  },
  {
    id: 'custom-category',
    name: 'Detektif Kategori',
    description: 'Buat kategori custom pertamamu',
    icon: 'MagnifyingGlass',
    condition: 'Create first custom category',
    xp_reward: 15,
  },
  {
    id: 'multi-wallet',
    name: 'Kantong Banyak',
    description: 'Buat 3 kantong/rekening berbeda',
    icon: 'Wallet',
    condition: 'Have 3+ wallets',
    xp_reward: 25,
  },
  {
    id: 'first-debt-paid',
    name: 'Lunas!',
    description: 'Lunasi hutang pertamamu',
    icon: 'CheckCircle',
    condition: 'Pay off first debt',
    xp_reward: 30,
  },
  {
    id: 'first-split',
    name: 'Bagi Rata',
    description: 'Lakukan split bill pertamamu',
    icon: 'UsersThree',
    condition: 'First split bill',
    xp_reward: 25,
  },
  {
    id: 'hundred-transactions',
    name: 'Centurion',
    description: 'Catat 100 transaksi',
    icon: 'Star',
    condition: 'Record 100 transactions',
    xp_reward: 100,
  },
  {
    id: 'big-saver',
    name: 'Penabung Ulung',
    description: 'Total saldo mencapai Rp10.000.000',
    icon: 'PiggyBank',
    condition: 'Total balance >= 10M IDR',
    xp_reward: 75,
  },
  {
    id: 'ai-advisor',
    name: 'Konsultan Bijak',
    description: 'Gunakan AI Financial Advisor untuk pertama kali',
    icon: 'Robot',
    condition: 'Use AI advisor',
    xp_reward: 20,
  },
  {
    id: 'level-5',
    name: 'Budget Master',
    description: 'Capai Level 5',
    icon: 'Crown',
    condition: 'Reach level 5',
    xp_reward: 50,
  },
  {
    id: 'level-10',
    name: 'Financial Expert',
    description: 'Capai Level 10',
    icon: 'Medal',
    condition: 'Reach level 10',
    xp_reward: 100,
  },
];

/**
 * Check if a badge should be unlocked based on conditions
 */
export function checkBadgeUnlock(
  badgeId: string,
  stats: {
    totalTransactions: number;
    streakDays: number;
    walletCount: number;
    debtsSettled: number;
    splitBillCount: number;
    totalBalance: number;
    usedAdvisor: boolean;
    customCategories: number;
    level: number;
  }
): boolean {
  switch (badgeId) {
    case 'first-transaction':
      return stats.totalTransactions >= 1;
    case 'streak-7':
      return stats.streakDays >= 7;
    case 'streak-30':
      return stats.streakDays >= 30;
    case 'custom-category':
      return stats.customCategories >= 1;
    case 'multi-wallet':
      return stats.walletCount >= 3;
    case 'first-debt-paid':
      return stats.debtsSettled >= 1;
    case 'first-split':
      return stats.splitBillCount >= 1;
    case 'hundred-transactions':
      return stats.totalTransactions >= 100;
    case 'big-saver':
      return stats.totalBalance >= 10_000_000;
    case 'ai-advisor':
      return stats.usedAdvisor;
    case 'level-5':
      return stats.level >= 5;
    case 'level-10':
      return stats.level >= 10;
    default:
      return false;
  }
}

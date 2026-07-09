// ============================================
// Pundi — Preset Categories
// ============================================

import { Category } from '@/lib/types';

export const PRESET_CATEGORIES: Omit<Category, 'id'>[] = [
  // --- Expense ---
  { user_id: null, name: 'Makan & Minum', type: 'expense', icon: 'ForkKnife', color: '#F97316', order: 1 },
  { user_id: null, name: 'Transport', type: 'expense', icon: 'Car', color: '#3B82F6', order: 2 },
  { user_id: null, name: 'Belanja', type: 'expense', icon: 'ShoppingCart', color: '#EC4899', order: 3 },
  { user_id: null, name: 'Hiburan', type: 'expense', icon: 'GameController', color: '#8B5CF6', order: 4 },
  { user_id: null, name: 'Tagihan', type: 'expense', icon: 'Receipt', color: '#EF4444', order: 5 },
  { user_id: null, name: 'Kesehatan', type: 'expense', icon: 'Heart', color: '#10B981', order: 6 },
  { user_id: null, name: 'Pendidikan', type: 'expense', icon: 'GraduationCap', color: '#6366F1', order: 7 },
  { user_id: null, name: 'Kopi', type: 'expense', icon: 'Coffee', color: '#92400E', order: 8 },
  { user_id: null, name: 'Groceries', type: 'expense', icon: 'Basket', color: '#059669', order: 9 },
  { user_id: null, name: 'Langganan', type: 'expense', icon: 'Repeat', color: '#7C3AED', order: 10 },
  { user_id: null, name: 'Donasi', type: 'expense', icon: 'HandHeart', color: '#D97706', order: 11 },
  { user_id: null, name: 'Lainnya', type: 'expense', icon: 'DotsThree', color: '#6B7280', order: 12 },

  // --- Income ---
  { user_id: null, name: 'Gaji', type: 'income', icon: 'Money', color: '#22C55E', order: 1 },
  { user_id: null, name: 'Freelance', type: 'income', icon: 'Laptop', color: '#06B6D4', order: 2 },
  { user_id: null, name: 'Investasi', type: 'income', icon: 'TrendUp', color: '#8B5CF6', order: 3 },
  { user_id: null, name: 'Hadiah', type: 'income', icon: 'Gift', color: '#EC4899', order: 4 },
  { user_id: null, name: 'Lainnya', type: 'income', icon: 'DotsThree', color: '#6B7280', order: 5 },
];

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

/**
 * Default wallet presets
 */
export const DEFAULT_WALLETS = [
  { name: 'Cash', type: 'cash' as const, color: '#22C55E', icon: 'Money' },
  { name: 'Bank BCA', type: 'bank' as const, color: '#3B82F6', icon: 'Bank' },
  { name: 'GoPay', type: 'ewallet' as const, color: '#00AED6', icon: 'DeviceMobile' },
];

// ============================================
// Pundi — Bottom Tab Bar
// ============================================

"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  House,
  ListBullets,
  Plus,
  UsersThree,
  User,
} from '@phosphor-icons/react';
import { haptic } from '@/lib/utils/haptic';

interface TabItem {
  id: string;
  label: string;
  href: string;
  icon: typeof House;
}

const tabs: TabItem[] = [
  { id: 'dashboard', label: 'Home', href: '/dashboard', icon: House },
  { id: 'transactions', label: 'Transaksi', href: '/transactions', icon: ListBullets },
  { id: 'add', label: 'Tambah', href: '#add', icon: Plus },
  { id: 'debts', label: 'Hutang/Split', href: '/debts', icon: UsersThree },
  { id: 'profile', label: 'Profil', href: '/profile', icon: User },
];

interface BottomTabBarProps {
  onAddPress?: () => void;
}

export function BottomTabBar({ onAddPress }: BottomTabBarProps) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-auto px-1"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0px)' }}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-bg-elevated/80 backdrop-blur-2xl rounded-full border border-border-light shadow-elevated">
        {tabs.map((tab) => {
          const isActive = tab.id !== 'add' && pathname.startsWith(tab.href);
          const isAddButton = tab.id === 'add';
          const Icon = tab.icon;

          if (isAddButton) {
            return (
              <button
                key={tab.id}
                id="tab-add-transaction"
                onClick={() => {
                  haptic('medium');
                  onAddPress?.();
                }}
                className="relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#6366F1] via-[#A855F7] to-[#EC4899] shadow-ai-glow active:scale-95 transition-transform mx-1"
                aria-label="Tambah transaksi"
              >
                <Plus size={24} weight="bold" className="text-white relative z-10" />
                {/* Glow pulse */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-[#6366F1] via-[#A855F7] to-[#EC4899]"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ zIndex: 0 }}
                />
              </button>
            );
          }

          return (
            <Link
              key={tab.id}
              href={tab.href}
              id={`tab-${tab.id}`}
              onClick={() => haptic('light')}
              className="flex flex-col items-center justify-center gap-1 w-[46px] py-1 relative haptic-press"
            >
              <div className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-colors ${isActive ? 'bg-text-primary text-bg-primary' : 'text-text-tertiary'}`}>
                <Icon
                  size={20}
                  weight={isActive ? 'fill' : 'regular'}
                />
              </div>
              <span
                className={`text-[9px] leading-none ${
                  isActive ? 'text-text-primary font-bold' : 'text-text-tertiary font-medium'
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

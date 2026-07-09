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
      className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border-light pb-safe"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
    >
      <div className="flex items-end justify-around px-2 h-[56px]">
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
                className="relative -top-3 flex items-center justify-center w-[52px] h-[52px] rounded-full bg-accent-primary shadow-[0_4px_20px_rgba(34,197,94,0.35)] active:scale-95 transition-transform"
                aria-label="Tambah transaksi"
              >
                <Plus size={26} weight="bold" className="text-white" />
                {/* Glow pulse */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-accent-primary"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ zIndex: -1 }}
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
              className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 relative haptic-press"
            >
              <Icon
                size={24}
                weight={isActive ? 'duotone' : 'regular'}
                className={isActive ? 'text-accent-primary' : 'text-text-tertiary'}
              />
              <span
                className={`text-[10px] leading-tight ${
                  isActive ? 'text-accent-primary font-semibold' : 'text-text-tertiary'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute -bottom-1 w-5 h-[3px] rounded-full bg-accent-primary"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

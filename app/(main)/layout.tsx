// ============================================
// Pundi — Main App Layout (with Tab Bar)
// ============================================

"use client";

import React, { useState } from 'react';
import { BottomTabBar } from '@/components/ui/BottomTabBar';
import { AddTransactionSheet } from '@/components/transactions/AddTransactionSheet';
import { AddMenuSheet } from '@/components/ui/AddMenuSheet';
import { LevelUpModal } from '@/components/gamification/LevelUpModal';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main Content */}
      <main className="flex-1 pb-[var(--tab-bar-height)]">
        {children}
      </main>

      {/* Bottom Tab Bar */}
      <BottomTabBar onAddPress={() => setIsAddMenuOpen(true)} />

      {/* Add Menu Hub */}
      <AddMenuSheet
        isOpen={isAddMenuOpen}
        onClose={() => setIsAddMenuOpen(false)}
        onOpenTransaction={() => setIsAddTxOpen(true)}
      />

      {/* Add Transaction Sheet */}
      <AddTransactionSheet
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
      />

      {/* Level Up Modal */}
      <LevelUpModal />
    </div>
  );
}

// ============================================
// Pundi — Main App Layout (with Tab Bar)
// ============================================

"use client";

import React, { useState } from 'react';
import { BottomTabBar } from '@/components/ui/BottomTabBar';
import { AddTransactionSheet } from '@/components/transactions/AddTransactionSheet';
import { LevelUpModal } from '@/components/gamification/LevelUpModal';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main Content */}
      <main className="flex-1 pb-[var(--tab-bar-height)]">
        {children}
      </main>

      {/* Bottom Tab Bar */}
      <BottomTabBar onAddPress={() => setIsAddSheetOpen(true)} />

      {/* Add Transaction Sheet */}
      <AddTransactionSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
      />

      {/* Level Up Modal */}
      <LevelUpModal />
    </div>
  );
}

// ============================================
// Pundi — Hutang & Split Bill Page
// ============================================

"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/lib/utils/haptic';
import { DebtTab } from '@/components/debts/DebtTab';
import { ReceivableTab } from '@/components/debts/ReceivableTab';
import { SplitBillTab } from '@/components/debts/SplitBillTab';

type Tab = 'debt' | 'receivable' | 'split';

export default function DebtsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('debt');

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="pt-safe">
        <div className="px-5 pt-4 pb-3">
          <motion.h1
            className="text-[28px] font-bold text-text-primary tracking-tight mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Hutang & Split
          </motion.h1>

          {/* Tab Selector */}
          <div className="flex gap-1 p-1 rounded-xl bg-bg-secondary">
            {[
              { id: 'debt' as Tab, label: 'Hutang Saya' },
              { id: 'receivable' as Tab, label: 'Hutang Orang' },
              { id: 'split' as Tab, label: 'Split Bill' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { haptic('light'); setActiveTab(tab.id); }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-bg-elevated text-text-primary shadow-sm'
                    : 'text-text-tertiary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-5 pb-8">
        <AnimatePresence mode="wait">
          {activeTab === 'debt' && (
            <motion.div
              key="debt"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <DebtTab />
            </motion.div>
          )}
          {activeTab === 'receivable' && (
            <motion.div
              key="receivable"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <ReceivableTab />
            </motion.div>
          )}
          {activeTab === 'split' && (
            <motion.div
              key="split"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <SplitBillTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================
// Pundi — Budget Settings Sheet Component
// ============================================

"use client";

import React, { useState } from 'react';
import { useBudgetStore } from '@/lib/stores/budget-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { formatCurrency } from '@/lib/utils/currency';
import { haptic } from '@/lib/utils/haptic';
import { Sparkle, SpinnerGap } from '@phosphor-icons/react';
import { useToast } from '@/components/ui/Toast';

interface BudgetSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BudgetSettingsSheet({ isOpen, onClose }: BudgetSettingsSheetProps) {
  const toast = useToast();
  const { categories, getTotalByType, getCategoryTotals } = useTransactionStore();
  const { budgets, setCategoryBudget } = useBudgetStore();

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const [isAILoading, setIsAILoading] = useState(false);

  // Keep local edits
  const [localBudgets, setLocalBudgets] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    budgets.forEach((b) => {
      initial[b.categoryId] = b.amount.toString();
    });
    return initial;
  });

  const handleChange = (categoryId: string, val: string) => {
    setLocalBudgets({
      ...localBudgets,
      [categoryId]: val,
    });
  };

  const handleSave = () => {
    haptic('success');
    expenseCategories.forEach((cat) => {
      const val = parseInt(localBudgets[cat.id] || '0', 10) || 0;
      setCategoryBudget(cat.id, val);
    });
    onClose();
  };

  const handleAIAutoPilot = async () => {
    haptic('medium');
    setIsAILoading(true);
    
    try {
      // Get previous month's data as basis, or current if it's new
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      
      const income = getTotalByType('income', firstDay, lastDay) || getTotalByType('income');
      const expense = getTotalByType('expense', firstDay, lastDay) || getTotalByType('expense');
      const categoryBreakdown = getCategoryTotals(firstDay, lastDay, 'expense');

      if (!income) {
        toast.warning('DicatetinAja butuh data pemasukan untuk menghitung budget idealmu. Yuk catat pemasukan dulu!');
        return;
      }

      const res = await fetch('/api/ai/budget-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          income,
          expense,
          categoryBreakdown: categoryBreakdown.map(c => ({
            categoryId: c.categoryId,
            categoryName: c.category,
            amount: c.amount
          })),
          strictnessMode: 'normal'
        })
      });

      if (!res.ok) throw new Error('Gagal menghubungi AI Budget Coach');
      
      const data = await res.json();
      
      if (data.suggestions && Array.isArray(data.suggestions)) {
        const newLocalBudgets = { ...localBudgets };
        data.suggestions.forEach((s: { categoryId?: string; categoryName?: string; suggestedAmount: number }) => {
          if (s.categoryId && s.suggestedAmount > 0) {
            newLocalBudgets[s.categoryId] = s.suggestedAmount.toString();
          } else {
            // Find by name if id is missing/wrong
            const cat = expenseCategories.find(c => c.name.toLowerCase() === s.categoryName?.toLowerCase());
            if (cat && s.suggestedAmount > 0) {
              newLocalBudgets[cat.id] = s.suggestedAmount.toString();
            }
          }
        });
        setLocalBudgets(newLocalBudgets);
        haptic('success');
      }
    } catch (err) {
      console.error(err);
      toast.warning('Maaf, AI sedang sibuk. Coba atur manual dulu ya!');
    } finally {
      setIsAILoading(false);
    }
  };

  // Calculate live totals for the sheet header
  const liveMonthly = expenseCategories.reduce((sum, cat) => {
    const val = parseInt(localBudgets[cat.id] || '0', 10) || 0;
    return sum + val;
  }, 0);
  const liveWeekly = Math.round(liveMonthly / 4);
  const liveDaily = Math.round(liveMonthly / 30);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Atur Budget Bulanan">
      <div className="p-5 flex flex-col h-[75vh]">
        {/* Cascade Summary Header */}
        <div className="flex items-center justify-between mb-3">
          <button 
            onClick={handleAIAutoPilot}
            disabled={isAILoading}
            className="flex items-center justify-center w-full gap-2 py-2.5 rounded-xl bg-accent-secondary/10 text-accent-secondary text-xs font-bold active:scale-[0.98] transition-transform border border-accent-secondary/20"
          >
            {isAILoading ? (
              <><SpinnerGap size={16} className="animate-spin" /> Meracik Budget...</>
            ) : (
              <><Sparkle size={16} weight="fill" /> Minta Saran AI</>
            )}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-bg-secondary mb-4 text-center">
          <div>
            <p className="text-[10px] text-text-tertiary uppercase font-semibold">Bulanan</p>
            <p className="text-xs font-bold text-text-primary tabular-nums mt-0.5">
              {formatCurrency(liveMonthly)}
            </p>
          </div>
          <div className="border-x border-border-light">
            <p className="text-[10px] text-text-tertiary uppercase font-semibold">Mingguan</p>
            <p className="text-xs font-bold text-text-primary tabular-nums mt-0.5">
              {formatCurrency(liveWeekly)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-text-tertiary uppercase font-semibold">Harian</p>
            <p className="text-xs font-bold text-accent-secondary tabular-nums mt-0.5">
              {formatCurrency(liveDaily)}
            </p>
          </div>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-0.5 pb-4">
          {expenseCategories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated border border-border-light"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: cat.color + '15' }}
              >
                <DynamicIcon name={cat.icon} size={20} weight="duotone" style={{ color: cat.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-text-primary block truncate">
                  {cat.name}
                </span>
                <span className="text-[10px] text-text-tertiary">
                  Budget per bulan
                </span>
              </div>
              <div className="flex items-center gap-1.5 max-w-[120px]">
                <span className="text-xs text-text-tertiary">Rp</span>
                <input
                  type="number"
                  value={localBudgets[cat.id] || ''}
                  onChange={(e) => handleChange(cat.id, e.target.value)}
                  placeholder="0"
                  className="w-full text-right bg-bg-secondary rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-bold outline-none border border-transparent focus:border-accent-secondary"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <button
          onClick={handleSave}
          className="w-full py-4 rounded-2xl bg-accent-secondary text-text-on-accent font-bold text-base active:scale-[0.98] transition-transform shadow-[0_4px_15px_rgba(0,174,214,0.3)] mt-2"
        >
          Simpan Budget ✨
        </button>
      </div>
    </BottomSheet>
  );
}

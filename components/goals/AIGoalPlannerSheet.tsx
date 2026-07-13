"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Sparkle, SpinnerGap, CaretDown, CaretUp, CalendarBlank, WarningCircle } from '@phosphor-icons/react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { haptic } from '@/lib/utils/haptic';

interface AIGoalPlannerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  goalName: string;
  targetAmount: number;
  currentSaved: number;
}

export function AIGoalPlannerSheet({ isOpen, onClose, goalName, targetAmount, currentSaved }: AIGoalPlannerSheetProps) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [selectedMode, setSelectedMode] = useState<string>('balanced');
  const [error, setError] = useState<string | null>(null);

  const { getTotalByType, getCategoryTotals } = useTransactionStore();

  const handleGeneratePlan = async () => {
    haptic('medium');
    setLoading(true);
    setError(null);
    setPlan(null);

    try {
      // Data context
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      
      const income = getTotalByType('income', firstDay, lastDay) || getTotalByType('income');
      const expense = getTotalByType('expense', firstDay, lastDay) || getTotalByType('expense');
      const categoryBreakdown = getCategoryTotals(firstDay, lastDay, 'expense');

      const res = await fetch('/api/ai/goal-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalName,
          targetAmount,
          currentSaved,
          income,
          expense,
          categoryBreakdown: categoryBreakdown.map(c => ({ name: c.category, amount: c.amount }))
        })
      });

      if (!res.ok) throw new Error('Gagal menghubungi AI.');
      
      const data = await res.json();
      if (data.plans) {
        setPlan(data);
        haptic('success');
      } else {
        throw new Error('Format balasan AI tidak valid.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan internal.');
      haptic('error');
    } finally {
      setLoading(false);
    }
  };

  const selectedPlanData = plan?.plans?.find((p: any) => p.mode === selectedMode);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="AI Goal Planner">
      <div className="p-5 flex flex-col h-[80vh]">
        
        {/* Goal Info */}
        <div className="flex items-center gap-4 bg-bg-secondary p-4 rounded-2xl mb-4">
          <div className="w-12 h-12 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary">
            <Target size={24} weight="fill" />
          </div>
          <div>
            <h3 className="font-bold text-text-primary text-[15px]">{goalName}</h3>
            <p className="text-xs text-text-tertiary mt-1">Target: {formatCurrency(targetAmount)}</p>
          </div>
        </div>

        {/* Generated Plan View */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
          {!plan && !loading && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="text-4xl mb-4">🤖</span>
              <h3 className="text-[15px] font-bold text-text-primary mb-2">Mau tau cara capai target ini?</h3>
              <p className="text-xs text-text-secondary max-w-[260px] leading-relaxed mb-6">
                DicatetinAja AI akan menganalisis riwayat pengeluaranmu dan membuatkan 3 skenario tabungan yang paling masuk akal buatmu.
              </p>
              <button
                onClick={handleGeneratePlan}
                className="px-6 py-3 rounded-2xl bg-accent-secondary text-white text-sm font-bold active:scale-95 transition-transform flex items-center gap-2 shadow-md"
              >
                <Sparkle size={18} weight="fill" /> Buatkan Rencana
              </button>
              {error && <p className="text-xs text-accent-danger mt-4">{error}</p>}
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <SpinnerGap size={32} className="animate-spin text-accent-secondary" />
              <p className="text-sm font-medium text-text-primary animate-pulse">Menyusun strategi...</p>
            </div>
          )}

          {plan && selectedPlanData && (
            <AnimatePresence mode="wait">
              <motion.div
                key="plan-results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                <p className="text-xs text-text-secondary italic">"{plan.summary}"</p>

                {/* Mode Selector */}
                <div className="flex bg-bg-secondary p-1 rounded-xl">
                  {['relaxed', 'balanced', 'aggressive'].map(m => (
                    <button
                      key={m}
                      onClick={() => { haptic('light'); setSelectedMode(m); }}
                      className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                        selectedMode === m ? 'bg-bg-elevated text-text-primary shadow-sm' : 'text-text-tertiary'
                      }`}
                    >
                      {m === 'relaxed' ? 'Santai' : m === 'balanced' ? 'Normal' : 'Agresif'}
                    </button>
                  ))}
                </div>

                {/* Saving Rate */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-bg-elevated border border-border-light rounded-xl p-3 text-center">
                    <p className="text-[9px] text-text-tertiary uppercase font-bold mb-1">Per Hari</p>
                    <p className="text-xs font-bold text-accent-primary">{formatCurrency(selectedPlanData.dailySaving)}</p>
                  </div>
                  <div className="bg-bg-elevated border border-border-light rounded-xl p-3 text-center">
                    <p className="text-[9px] text-text-tertiary uppercase font-bold mb-1">Per Minggu</p>
                    <p className="text-xs font-bold text-text-primary">{formatCurrency(selectedPlanData.weeklySaving)}</p>
                  </div>
                  <div className="bg-bg-elevated border border-border-light rounded-xl p-3 text-center">
                    <p className="text-[9px] text-text-tertiary uppercase font-bold mb-1">Per Bulan</p>
                    <p className="text-xs font-bold text-text-primary">{formatCurrency(selectedPlanData.monthlySaving)}</p>
                  </div>
                </div>

                {/* Estimated Completion */}
                <div className="flex items-center justify-between bg-accent-secondary/10 border border-accent-secondary/20 p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <CalendarBlank size={24} className="text-accent-secondary" />
                    <div>
                      <p className="text-[11px] text-text-secondary">Estimasi Tercapai</p>
                      <p className="text-sm font-bold text-accent-secondary">{formatDate(selectedPlanData.estimatedCompletionDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Cuts */}
                {selectedPlanData.recommendedSourceCategories && selectedPlanData.recommendedSourceCategories.length > 0 && (
                  <div className="bg-bg-elevated border border-border-light p-4 rounded-xl">
                    <h4 className="text-[13px] font-bold text-text-primary mb-2">Saran Penghematan:</h4>
                    <ul className="space-y-1.5">
                      {selectedPlanData.recommendedSourceCategories.map((c: string, i: number) => (
                        <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                          <span className="text-accent-warning mt-0.5">•</span> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Risk */}
                {selectedPlanData.riskMessage && (
                  <div className="flex gap-2 items-start bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/20">
                    <WarningCircle size={16} className="text-accent-danger mt-0.5" weight="fill" />
                    <p className="text-[11px] text-accent-danger leading-relaxed">{selectedPlanData.riskMessage}</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Apply Button */}
        {plan && (
          <div className="pt-2">
             <button
              onClick={() => { haptic('success'); onClose(); }}
              className="w-full py-4 rounded-2xl bg-accent-secondary text-white font-bold text-base active:scale-[0.98] transition-transform shadow-md"
            >
              Tutup & Coba Jalankan Rencana!
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

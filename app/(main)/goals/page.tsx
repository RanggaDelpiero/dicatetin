// ============================================
// Pundi — Goals / Sinking Funds Page
// ============================================

"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Plus, X, Trash, Money } from '@phosphor-icons/react';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useGoalStore } from '@/lib/stores/goal-store';
import { formatCurrency } from '@/lib/utils/currency';
import { haptic } from '@/lib/utils/haptic';

const SUGGESTED_GOALS = [
  { name: 'Trip Bali', emoji: '🏝', color: '#06B6D4' },
  { name: 'Dana Darurat', emoji: '🆘', color: '#EF4444' },
  { name: 'Gadget Baru', emoji: '📱', color: '#8B5CF6' },
  { name: 'Tabungan Nikah', emoji: '💍', color: '#EC4899' },
  { name: 'Kendaraan', emoji: '🏍', color: '#F97316' },
  { name: 'Investasi', emoji: '📈', color: '#22C55E' },
];

export default function GoalsPage() {
  const { goals, addGoal, deleteGoal, addContribution, getProgress, getSuggestedMonthlyTarget } = useGoalStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showContribForm, setShowContribForm] = useState<string | null>(null);

  // Add form state
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [color, setColor] = useState('#6366F1');
  const [deadline, setDeadline] = useState('');

  // Contribution form state
  const [contribAmount, setContribAmount] = useState('');
  const [contribNote, setContribNote] = useState('');

  const handleAddGoal = () => {
    if (!name.trim() || !targetAmount) return;
    addGoal({
      name: name.trim(),
      targetAmount: parseInt(targetAmount),
      currentAmount: 0,
      iconEmoji: emoji,
      color,
      deadline: deadline || undefined,
      monthlyTarget: undefined,
    });
    setShowAddForm(false);
    setName('');
    setTargetAmount('');
    setEmoji('🎯');
    setColor('#6366F1');
    setDeadline('');
    haptic('success');
  };

  const handleAddContribution = (goalId: string) => {
    if (!contribAmount) return;
    addContribution(goalId, parseInt(contribAmount), contribNote || undefined);
    setShowContribForm(null);
    setContribAmount('');
    setContribNote('');
    haptic('success');
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="pt-safe">
        <div className="px-5 pt-4 pb-3 flex items-center gap-3">
          <Link
            href="/profile"
            onClick={() => haptic('light')}
            className="w-9 h-9 rounded-full bg-bg-elevated shadow-[0_2px_12px_rgba(0,0,0,0.06)] flex items-center justify-center"
          >
            <ArrowLeft size={20} weight="bold" className="text-text-primary" />
          </Link>
          <motion.h1
            className="text-[28px] font-bold text-text-primary tracking-tight flex-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Target Tabungan 🎯
          </motion.h1>
          <button
            onClick={() => { setShowAddForm(true); haptic('light'); }}
            className="w-9 h-9 rounded-full bg-accent-secondary text-text-on-accent flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <Plus size={18} weight="bold" />
          </button>
        </div>
      </div>

      <div className="px-5 pb-8 space-y-4">
        {/* Goals List */}
        {goals.length === 0 ? (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p className="text-5xl mb-4">🎯</p>
            <h3 className="text-base font-bold text-text-primary mb-1">Belum Ada Target</h3>
            <p className="text-xs text-text-secondary mb-5">
              Mulai nabung dengan membuat target pertamamu!
            </p>

            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              {SUGGESTED_GOALS.map((s) => (
                <button
                  key={s.name}
                  onClick={() => {
                    setName(s.name);
                    setEmoji(s.emoji);
                    setColor(s.color);
                    setShowAddForm(true);
                    haptic('light');
                  }}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl bg-bg-elevated shadow-[0_2px_8px_rgba(0,0,0,0.04)] active:scale-95 transition-transform"
                >
                  <span className="text-2xl">{s.emoji}</span>
                  <span className="text-[10px] text-text-secondary font-medium">{s.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal, index) => {
              const progress = getProgress(goal.id);
              const monthlyTarget = goal.deadline ? getSuggestedMonthlyTarget(goal.id) : 0;

              return (
                <motion.div
                  key={goal.id}
                  className="rounded-[20px] bg-bg-elevated shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-5 overflow-hidden relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Decorative bg */}
                  <div
                    className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5"
                    style={{ backgroundColor: goal.color, transform: 'translate(30%, -30%)' }}
                  />

                  <div className="flex items-center gap-4 mb-4">
                    <ProgressRing
                      percentage={progress.percentage}
                      size={64}
                      strokeWidth={5}
                      color={goal.color}
                    >
                      <span className="text-xl">{goal.iconEmoji}</span>
                    </ProgressRing>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-text-primary truncate">{goal.name}</h3>
                      <p className="text-xs text-text-secondary tabular-nums mt-0.5">
                        {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold tabular-nums" style={{ color: goal.color }}>
                          {progress.percentage}%
                        </span>
                        {progress.estimatedCompletion && (
                          <span className="text-[10px] text-text-tertiary">
                            · Estimasi: {progress.estimatedCompletion}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-bg-secondary overflow-hidden mb-3">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: goal.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress.percentage}%` }}
                      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.3 }}
                    />
                  </div>

                  {/* Info row */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-text-tertiary">
                      Sisa: {formatCurrency(progress.remaining)}
                    </span>
                    {monthlyTarget > 0 && (
                      <span className="text-text-tertiary">
                        Target/bln: {formatCurrency(monthlyTarget)}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => { setShowContribForm(goal.id); haptic('light'); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs text-text-on-accent active:scale-[0.98] transition-all"
                      style={{ backgroundColor: goal.color }}
                    >
                      <Money size={14} weight="bold" /> Tambah Dana
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus target "${goal.name}"?`)) {
                          deleteGoal(goal.id);
                          haptic('medium');
                        }
                      }}
                      className="py-2.5 px-3 rounded-xl bg-accent-danger/10 text-accent-danger active:scale-[0.98] transition-all"
                    >
                      <Trash size={14} weight="bold" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Goal Form (Bottom Sheet) */}
      <AnimatePresence>
        {showAddForm && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(false)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-[60] bg-bg-elevated rounded-t-[24px] max-h-[85vh] overflow-y-auto"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="p-5 pb-safe">
                <div className="w-10 h-1 rounded-full bg-border-medium mx-auto mb-4" />
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-text-primary">Target Baru</h2>
                  <button onClick={() => setShowAddForm(false)} className="w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center">
                    <X size={18} weight="bold" className="text-text-secondary" />
                  </button>
                </div>

                {/* Quick Pick Emoji */}
                <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                  {SUGGESTED_GOALS.map((s) => (
                    <button
                      key={s.name}
                      onClick={() => { setEmoji(s.emoji); setColor(s.color); if (!name) setName(s.name); haptic('light'); }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl flex-shrink-0 transition-all ${
                        emoji === s.emoji ? 'bg-accent-secondary/10 ring-2 ring-accent-secondary' : 'bg-bg-secondary'
                      }`}
                    >
                      <span className="text-lg">{s.emoji}</span>
                      <span className="text-xs text-text-secondary">{s.name}</span>
                    </button>
                  ))}
                </div>

                <label className="block mb-3">
                  <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Nama Target</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Trip Bali, Dana Darurat..."
                    className="w-full mt-1.5 px-4 py-3 rounded-xl bg-bg-secondary text-text-primary text-sm placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-accent-secondary/30"
                  />
                </label>

                <label className="block mb-3">
                  <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Target Nominal (Rp)</span>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="5000000"
                    className="w-full mt-1.5 px-4 py-3 rounded-xl bg-bg-secondary text-text-primary text-sm placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-accent-secondary/30 tabular-nums"
                  />
                </label>

                <label className="block mb-5">
                  <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Deadline (Opsional)</span>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full mt-1.5 px-4 py-3 rounded-xl bg-bg-secondary text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent-secondary/30"
                  />
                </label>

                <button
                  onClick={handleAddGoal}
                  disabled={!name.trim() || !targetAmount}
                  className="w-full py-4 rounded-xl bg-accent-secondary text-text-on-accent font-bold text-base disabled:opacity-40 active:scale-[0.98] transition-all"
                >
                  Buat Target 🎯
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Contribution Form (Bottom Sheet) */}
      <AnimatePresence>
        {showContribForm && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowContribForm(null)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-[60] bg-bg-elevated rounded-t-[24px]"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="p-5 pb-safe">
                <div className="w-10 h-1 rounded-full bg-border-medium mx-auto mb-4" />
                <h2 className="text-lg font-bold text-text-primary mb-4">Tambah Dana 💰</h2>

                <label className="block mb-3">
                  <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Jumlah (Rp)</span>
                  <input
                    type="number"
                    value={contribAmount}
                    onChange={(e) => setContribAmount(e.target.value)}
                    placeholder="100000"
                    className="w-full mt-1.5 px-4 py-3 rounded-xl bg-bg-secondary text-text-primary text-sm placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-accent-secondary/30 tabular-nums"
                    autoFocus
                  />
                </label>

                <label className="block mb-5">
                  <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Catatan (Opsional)</span>
                  <input
                    type="text"
                    value={contribNote}
                    onChange={(e) => setContribNote(e.target.value)}
                    placeholder="Gaji bulan Juli..."
                    className="w-full mt-1.5 px-4 py-3 rounded-xl bg-bg-secondary text-text-primary text-sm placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-accent-secondary/30"
                  />
                </label>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowContribForm(null)}
                    className="flex-1 py-3 rounded-xl bg-bg-secondary text-text-secondary font-semibold text-sm"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => showContribForm && handleAddContribution(showContribForm)}
                    disabled={!contribAmount}
                    className="flex-1 py-3 rounded-xl bg-accent-primary text-text-on-accent font-bold text-sm disabled:opacity-40 active:scale-[0.98] transition-all"
                  >
                    Simpan 💰
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Pundi — Debt Tab (Hutang Saya)
// ============================================

"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, CalendarBlank, Trash, CheckCircle } from '@phosphor-icons/react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useDebtStore } from '@/lib/stores/debt-store';
import { useGamificationStore } from '@/lib/stores/gamification-store';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { haptic } from '@/lib/utils/haptic';
import { XP_REWARDS } from '@/lib/gamification/xp';
import { calcPercentage } from '@/lib/utils/currency';

export function DebtTab() {
  const { debts, addDebt, deleteDebt, addPayment, getTotalDebt } = useDebtStore();
  const { addXP, recordActivity, unlockBadge } = useGamificationStore();

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showPaySheet, setShowPaySheet] = useState<string | null>(null);

  // Add debt form
  const [creditor, setCreditor] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');

  // Payment form
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');

  const handleAddDebt = () => {
    const amount = parseInt(totalAmount, 10);
    if (!creditor.trim() || !amount || amount <= 0) {
      haptic('error');
      return;
    }
    haptic('success');
    addDebt({
      creditor,
      total_amount: amount,
      remaining_amount: amount,
      due_date: dueDate || undefined,
      status: 'active',
      note: note || undefined,
    });
    setCreditor('');
    setTotalAmount('');
    setDueDate('');
    setNote('');
    setShowAddSheet(false);
  };

  const handlePayment = (debtId: string) => {
    const amount = parseInt(payAmount, 10);
    if (!amount || amount <= 0) {
      haptic('error');
      return;
    }
    haptic('success');
    addPayment(debtId, amount, payNote || undefined);

    // Check if debt is now paid off
    const debt = debts.find((d) => d.id === debtId);
    if (debt && debt.remaining_amount - amount <= 0) {
      addXP(XP_REWARDS.COMPLETE_DEBT_PAYMENT);
      unlockBadge('first-debt-paid');
      recordActivity();
    }

    setPayAmount('');
    setPayNote('');
    setShowPaySheet(null);
  };

  const activeDebts = debts.filter((d) => d.status === 'active');
  const paidDebts = debts.filter((d) => d.status === 'paid_off');

  return (
    <div className="space-y-4 mt-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-text-tertiary">Total hutang aktif</p>
          <p className="text-xl font-bold text-accent-danger tabular-nums">
            {formatCurrency(getTotalDebt())}
          </p>
        </div>
        <button
          onClick={() => { haptic('light'); setShowAddSheet(true); }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent-secondary text-white text-sm font-semibold active:scale-95 transition-transform"
        >
          <Plus size={16} weight="bold" />
          Tambah
        </button>
      </div>

      {/* Active debts */}
      {activeDebts.length === 0 && paidDebts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-sm text-text-secondary">Belum ada hutang</p>
          <p className="text-xs text-text-tertiary mt-1">Semoga tetap bebas hutang ya!</p>
        </div>
      ) : (
        <>
          {activeDebts.map((debt, idx) => {
            const paid = debt.total_amount - debt.remaining_amount;
            const pct = calcPercentage(paid, debt.total_amount);

            return (
              <motion.div
                key={debt.id}
                className="bg-bg-elevated rounded-[14px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{debt.creditor}</p>
                    {debt.due_date && (
                      <p className="text-xs text-accent-warning flex items-center gap-1 mt-0.5">
                        <CalendarBlank size={12} weight="duotone" />
                        Jatuh tempo: {formatDate(debt.due_date)}
                      </p>
                    )}
                    {debt.note && (
                      <p className="text-xs text-text-tertiary mt-0.5">{debt.note}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      haptic('medium');
                      if (confirm(`Hapus hutang ke "${debt.creditor}"?`)) deleteDebt(debt.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-bg-secondary"
                    aria-label={`Hapus hutang ke ${debt.creditor}`}
                  >
                    <Trash size={16} className="text-text-tertiary" />
                  </button>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-3 mb-2">
                  <ProgressRing
                    percentage={pct}
                    size={44}
                    strokeWidth={4}
                    color="var(--accent-primary)"
                  >
                    <span className="text-[10px] font-bold text-accent-primary">{pct}%</span>
                  </ProgressRing>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-text-tertiary">Sisa</span>
                      <span className="font-bold text-accent-danger tabular-nums">
                        {formatCurrency(debt.remaining_amount)}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-bg-secondary overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-accent-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] mt-1 text-text-tertiary tabular-nums">
                      <span>Terbayar: {formatCurrency(paid)}</span>
                      <span>Total: {formatCurrency(debt.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Pay button */}
                <button
                  onClick={() => { haptic('light'); setShowPaySheet(debt.id); }}
                  className="w-full mt-2 py-2.5 rounded-xl bg-accent-primary/10 text-accent-primary text-sm font-semibold active:scale-[0.98] transition-transform"
                >
                  💰 Bayar Cicilan
                </button>
              </motion.div>
            );
          })}

          {/* Paid debts */}
          {paidDebts.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">
                Sudah Lunas ✅
              </p>
              {paidDebts.map((debt) => (
                <div
                  key={debt.id}
                  className="flex items-center gap-3 p-3 rounded-[14px] bg-accent-primary/5 mb-2"
                >
                  <CheckCircle size={20} weight="fill" className="text-accent-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{debt.creditor}</p>
                    <p className="text-xs text-text-tertiary">{formatCurrency(debt.total_amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Debt Sheet */}
      <BottomSheet isOpen={showAddSheet} onClose={() => setShowAddSheet(false)} title="Tambah Hutang">
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Kreditur (siapa?)</label>
            <input
              type="text"
              value={creditor}
              onChange={(e) => setCreditor(e.target.value)}
              placeholder="Contoh: Bank BCA, Teman A"
              className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-text-primary placeholder:text-text-tertiary outline-none text-sm"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Jumlah Total</label>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-text-primary placeholder:text-text-tertiary outline-none text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Jatuh Tempo (opsional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-text-primary outline-none text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Catatan (opsional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Misal: cicilan motor"
              className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-text-primary placeholder:text-text-tertiary outline-none text-sm"
            />
          </div>
          <button
            onClick={handleAddDebt}
            className="w-full py-4 rounded-2xl bg-accent-danger text-white font-semibold text-base active:scale-[0.98] transition-transform"
          >
            Tambah Hutang 📝
          </button>
        </div>
      </BottomSheet>

      {/* Payment Sheet */}
      <BottomSheet
        isOpen={showPaySheet !== null}
        onClose={() => setShowPaySheet(null)}
        title="Bayar Cicilan"
      >
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Jumlah Bayar</label>
            <input
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-text-primary placeholder:text-text-tertiary outline-none text-sm tabular-nums"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Catatan (opsional)</label>
            <input
              type="text"
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
              placeholder="Misal: cicilan bulan Juli"
              className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-text-primary placeholder:text-text-tertiary outline-none text-sm"
            />
          </div>
          <button
            onClick={() => showPaySheet && handlePayment(showPaySheet)}
            className="w-full py-4 rounded-2xl bg-accent-primary text-white font-semibold text-base active:scale-[0.98] transition-transform"
          >
            Bayar 💰
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}

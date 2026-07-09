// ============================================
// Pundi — Receivable Tab (Hutang Orang)
// ============================================

"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash, CheckCircle, User } from '@phosphor-icons/react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useReceivableStore } from '@/lib/stores/receivable-store';
import { useGamificationStore } from '@/lib/stores/gamification-store';
import { formatCurrency, calcPercentage } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { haptic } from '@/lib/utils/haptic';
import { XP_REWARDS } from '@/lib/gamification/xp';

export function ReceivableTab() {
  const { receivables, addReceivable, deleteReceivable, addPayment, getTotalReceivable } =
    useReceivableStore();
  const { addXP, recordActivity } = useGamificationStore();

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showPaySheet, setShowPaySheet] = useState<string | null>(null);

  // Form states
  const [debtor, setDebtor] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [note, setNote] = useState('');
  const [payAmount, setPayAmount] = useState('');

  const handleAdd = () => {
    const amount = parseInt(totalAmount, 10);
    if (!debtor.trim() || !amount || amount <= 0) {
      haptic('error');
      return;
    }
    haptic('success');
    addReceivable({
      debtor,
      total_amount: amount,
      remaining_amount: amount,
      status: 'unpaid',
      note: note || undefined,
    });
    setDebtor('');
    setTotalAmount('');
    setNote('');
    setShowAddSheet(false);
  };

  const handlePayment = (receivableId: string) => {
    const amount = parseInt(payAmount, 10);
    if (!amount || amount <= 0) {
      haptic('error');
      return;
    }
    haptic('success');
    addPayment(receivableId, amount);

    const rec = receivables.find((r) => r.id === receivableId);
    if (rec && rec.remaining_amount - amount <= 0) {
      addXP(XP_REWARDS.SETTLE_RECEIVABLE);
      recordActivity();
    }

    setPayAmount('');
    setShowPaySheet(null);
  };

  const activeReceivables = receivables.filter((r) => r.status !== 'paid');
  const paidReceivables = receivables.filter((r) => r.status === 'paid');

  return (
    <div className="space-y-4 mt-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-text-tertiary">Total piutang aktif</p>
          <p className="text-xl font-bold text-accent-secondary tabular-nums">
            {formatCurrency(getTotalReceivable())}
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

      {/* Active */}
      {activeReceivables.length === 0 && paidReceivables.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🤝</p>
          <p className="text-sm text-text-secondary">Belum ada piutang</p>
          <p className="text-xs text-text-tertiary mt-1">Catat kalau ada yang berhutang ke kamu</p>
        </div>
      ) : (
        <>
          {activeReceivables.map((rec, idx) => {
            const paid = rec.total_amount - rec.remaining_amount;
            const pct = calcPercentage(paid, rec.total_amount);

            return (
              <motion.div
                key={rec.id}
                className="bg-bg-elevated rounded-[14px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-accent-secondary/15 flex items-center justify-center">
                      <User size={18} weight="duotone" className="text-accent-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{rec.debtor}</p>
                      {rec.note && <p className="text-xs text-text-tertiary">{rec.note}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      haptic('medium');
                      if (confirm(`Hapus piutang "${rec.debtor}"?`)) deleteReceivable(rec.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-bg-secondary"
                  >
                    <Trash size={16} className="text-text-tertiary" />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-tertiary">
                      {rec.status === 'partial' ? 'Bayar sebagian' : 'Belum bayar'}
                    </span>
                    <span className="font-bold text-accent-secondary tabular-nums">
                      {formatCurrency(rec.remaining_amount)}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-bg-secondary overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-accent-secondary"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] mt-1 text-text-tertiary tabular-nums">
                    <span>Terbayar: {formatCurrency(paid)}</span>
                    <span>Total: {formatCurrency(rec.total_amount)}</span>
                  </div>
                </div>

                <button
                  onClick={() => { haptic('light'); setShowPaySheet(rec.id); }}
                  className="w-full mt-2 py-2.5 rounded-xl bg-accent-secondary/10 text-accent-secondary text-sm font-semibold active:scale-[0.98] transition-transform"
                >
                  ✅ Catat Pembayaran
                </button>
              </motion.div>
            );
          })}

          {/* Paid receivables */}
          {paidReceivables.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">
                Sudah Lunas ✅
              </p>
              {paidReceivables.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center gap-3 p-3 rounded-[14px] bg-accent-primary/5 mb-2"
                >
                  <CheckCircle size={20} weight="fill" className="text-accent-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{rec.debtor}</p>
                    <p className="text-xs text-text-tertiary">{formatCurrency(rec.total_amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Sheet */}
      <BottomSheet isOpen={showAddSheet} onClose={() => setShowAddSheet(false)} title="Catat Piutang">
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Siapa yang hutang?</label>
            <input
              type="text"
              value={debtor}
              onChange={(e) => setDebtor(e.target.value)}
              placeholder="Contoh: Teman B, Adik"
              className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-text-primary placeholder:text-text-tertiary outline-none text-sm"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Jumlah</label>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-text-primary placeholder:text-text-tertiary outline-none text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Catatan (opsional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Misal: pinjam buat makan"
              className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-text-primary placeholder:text-text-tertiary outline-none text-sm"
            />
          </div>
          <button
            onClick={handleAdd}
            className="w-full py-4 rounded-2xl bg-accent-secondary text-white font-semibold text-base active:scale-[0.98] transition-transform"
          >
            Catat Piutang 📝
          </button>
        </div>
      </BottomSheet>

      {/* Payment Sheet */}
      <BottomSheet isOpen={showPaySheet !== null} onClose={() => setShowPaySheet(null)} title="Catat Pembayaran">
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Jumlah yang dibayar</label>
            <input
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-text-primary placeholder:text-text-tertiary outline-none text-sm tabular-nums"
              autoFocus
            />
          </div>
          <button
            onClick={() => showPaySheet && handlePayment(showPaySheet)}
            className="w-full py-4 rounded-2xl bg-accent-primary text-white font-semibold text-base active:scale-[0.98] transition-transform"
          >
            Catat ✅
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}

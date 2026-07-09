// ============================================
// Pundi — Transactions List Page
// ============================================

"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, Trash, PencilSimple, MagnifyingGlass, Plus } from '@phosphor-icons/react';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate, formatRelativeDate, getCurrentMonthRange, getCurrentWeekRange } from '@/lib/utils/date';
import { haptic } from '@/lib/utils/haptic';

type Period = 'week' | 'month' | 'all';

export default function TransactionsPage() {
  const [period, setPeriod] = useState<Period>('month');
  const [search, setSearch] = useState('');
  const [swipedId, setSwipedId] = useState<string | null>(null);

  const { transactions, categories, deleteTransaction } = useTransactionStore();
  const { wallets, updateBalance } = useWalletStore();

  // Filter by period
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (period === 'week') {
      const { start, end } = getCurrentWeekRange();
      filtered = filtered.filter((tx) => {
        const d = tx.date.split('T')[0];
        return d >= start && d <= end;
      });
    } else if (period === 'month') {
      const { start, end } = getCurrentMonthRange();
      filtered = filtered.filter((tx) => {
        const d = tx.date.split('T')[0];
        return d >= start && d <= end;
      });
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((tx) => {
        const cat = categories.find((c) => c.id === tx.category_id);
        return (
          cat?.name.toLowerCase().includes(q) ||
          tx.note?.toLowerCase().includes(q) ||
          tx.amount.toString().includes(q)
        );
      });
    }

    // Sort by date desc
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return filtered;
  }, [transactions, categories, period, search]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, typeof filteredTransactions> = {};
    filteredTransactions.forEach((tx) => {
      const dateKey = tx.date.split('T')[0];
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(tx);
    });
    return Object.entries(groups);
  }, [filteredTransactions]);

  const handleDelete = (tx: (typeof transactions)[0]) => {
    haptic('medium');
    // Reverse balance change
    if (tx.type === 'income') {
      updateBalance(tx.wallet_id, -tx.amount);
    } else if (tx.type === 'expense') {
      updateBalance(tx.wallet_id, tx.amount);
    }
    deleteTransaction(tx.id);
    setSwipedId(null);
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="pt-safe">
        <div className="px-5 pt-4 pb-3">
          <div className="flex justify-between items-center mb-4">
            <motion.h1
              className="text-[28px] font-bold text-text-primary tracking-tight"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Transaksi
            </motion.h1>
            <Link
              href="/transactions/bulk"
              onClick={() => haptic('light')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-secondary/15 text-accent-secondary text-xs font-semibold active:scale-95 transition-transform"
            >
              <Plus size={14} weight="bold" />
              Catat Massal
            </Link>
          </div>

          {/* Segmented Control */}
          <div className="flex gap-1 p-1 rounded-xl bg-bg-secondary mb-3">
            {[
              { id: 'week' as Period, label: 'Minggu' },
              { id: 'month' as Period, label: 'Bulan' },
              { id: 'all' as Period, label: 'Semua' },
            ].map((seg) => (
              <button
                key={seg.id}
                onClick={() => { haptic('light'); setPeriod(seg.id); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  period === seg.id
                    ? 'bg-bg-elevated text-text-primary shadow-sm'
                    : 'text-text-tertiary'
                }`}
              >
                {seg.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-bg-secondary">
            <MagnifyingGlass size={18} className="text-text-tertiary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari transaksi..."
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
            />
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="px-5 pb-8">
        {grouped.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm text-text-secondary">Belum ada transaksi</p>
            <p className="text-xs text-text-tertiary mt-1">
              {period === 'week' ? 'Minggu ini belum ada catatan' : period === 'month' ? 'Bulan ini belum ada catatan' : 'Mulai catat keuanganmu!'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([date, txs]) => (
              <div key={date}>
                {/* Date header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                    {formatRelativeDate(date)}
                  </span>
                  <span className="text-xs text-text-tertiary">
                    {formatDate(date)}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {txs.map((tx, index) => {
                    const cat = categories.find((c) => c.id === tx.category_id);
                    const wallet = wallets.find((w) => w.id === tx.wallet_id);
                    const isSwiped = swipedId === tx.id;

                    return (
                      <div key={tx.id} className="relative overflow-hidden rounded-[14px]">
                        {/* Delete button (behind) */}
                        <div className="absolute right-0 top-0 bottom-0 flex items-center">
                          <button
                            onClick={() => handleDelete(tx)}
                            className="h-full px-5 bg-accent-danger text-white flex items-center justify-center"
                          >
                            <Trash size={20} weight="fill" />
                          </button>
                        </div>

                        {/* Transaction card */}
                        <motion.div
                          className="relative flex items-center gap-3 p-3 bg-bg-elevated shadow-[0_2px_12px_rgba(0,0,0,0.06)] rounded-[14px]"
                          drag="x"
                          dragConstraints={{ left: -80, right: 0 }}
                          dragElastic={0.1}
                          onDragEnd={(_, info) => {
                            if (info.offset.x < -50) {
                              setSwipedId(tx.id);
                            } else {
                              setSwipedId(null);
                            }
                          }}
                          animate={{ x: isSwiped ? -80 : 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          initial={{ opacity: 0, y: 10 }}
                        >
                          {/* Category icon */}
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: (cat?.color || '#6B7280') + '20' }}
                          >
                            <DynamicIcon
                              name={cat?.icon || 'DotsThree'}
                              size={20}
                              weight="duotone"
                              style={{ color: cat?.color || '#6B7280' }}
                            />
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">
                              {cat?.name || 'Lainnya'}
                            </p>
                            <p className="text-xs text-text-tertiary truncate">
                              {tx.note || wallet?.name || ''}
                            </p>
                          </div>

                          {/* Amount */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {tx.type === 'income' ? (
                              <ArrowUp size={12} weight="bold" className="text-accent-primary" />
                            ) : (
                              <ArrowDown size={12} weight="bold" className="text-accent-danger" />
                            )}
                            <span
                              className={`text-sm font-bold tabular-nums ${
                                tx.type === 'income' ? 'text-accent-primary' : 'text-text-primary'
                              }`}
                            >
                              {formatCurrency(tx.amount)}
                            </span>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

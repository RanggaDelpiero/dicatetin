// ============================================
// Pundi — Dashboard Page
// ============================================

"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUp, ArrowDown, Sparkle, CaretRight, Robot, Plus, PencilSimple } from '@phosphor-icons/react';
import { StreakFlame } from '@/components/gamification/StreakFlame';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { DonutChart } from '@/components/charts/DonutChart';
import { BudgetSettingsSheet } from '@/components/budget/BudgetSettingsSheet';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { useGamificationStore } from '@/lib/stores/gamification-store';
import { useBudgetStore } from '@/lib/stores/budget-store';
import { useDebtStore } from '@/lib/stores/debt-store';
import { useReceivableStore } from '@/lib/stores/receivable-store';
import { useRecurringStore } from '@/lib/stores/recurring-store';
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils/currency';
import { getCurrentMonthRange, getMonthName, formatRelativeDate } from '@/lib/utils/date';
import { getLevelProgress, getLevelTitle } from '@/lib/gamification/xp';
import { haptic } from '@/lib/utils/haptic';

export default function DashboardPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeWalletIndex, setActiveWalletIndex] = useState(0);

  const { transactions, getCategoryTotals, getTotalByType } = useTransactionStore();
  const { wallets, getTotalBalance } = useWalletStore();
  const { progress } = useGamificationStore();
  const { checkAndTriggerRecurring } = useRecurringStore();

  useEffect(() => {
    checkAndTriggerRecurring();
  }, [checkAndTriggerRecurring]);

  const [showBudgetSheet, setShowBudgetSheet] = useState(false);

  const { getTotalDailyBudget } = useBudgetStore();
  const dailyBudgetLimit = getTotalDailyBudget();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayExpense = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'expense' && tx.date.split('T')[0] === todayStr)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions, todayStr]);

  const remainingDailyBudget = dailyBudgetLimit - todayExpense;
  const dailyBudgetPct = dailyBudgetLimit > 0
    ? Math.max(0, Math.min(100, Math.round((remainingDailyBudget / dailyBudgetLimit) * 100)))
    : 0;

  const { start, end } = getCurrentMonthRange();
  const totalBalance = getTotalBalance();

  const totalReceivables = useReceivableStore((state) => state.getTotalReceivable());
  const totalDebts = useDebtStore((state) => state.getTotalDebt());
  const netWorth = totalBalance + totalReceivables - totalDebts;

  const monthIncome = getTotalByType('income', start, end);
  const monthExpense = getTotalByType('expense', start, end);
  const categoryTotals = getCategoryTotals(start, end, 'expense');
  const levelProgress = getLevelProgress(progress.xp);

  // Recent transactions (last 5)
  const recentTransactions = useMemo(() => {
    const cats = useTransactionStore.getState().categories;
    return transactions.slice(0, 5).map((tx) => ({
      ...tx,
      categoryData: cats.find((c) => c.id === tx.category_id),
      walletData: wallets.find((w) => w.id === tx.wallet_id),
    }));
  }, [transactions, wallets]);

  // Donut chart data
  const chartData = useMemo(() => {
    return categoryTotals.slice(0, 6).map((ct) => ({
      name: ct.category,
      value: ct.amount,
      color: ct.color,
    }));
  }, [categoryTotals]);

  return (
    <div ref={scrollRef} className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="pt-safe">
        <div className="px-5 pt-4 pb-2">
          {/* Top row: greeting + streak */}
          <div className="flex items-center justify-between mb-1">
            <div>
              <motion.p
                className="text-text-secondary text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {getMonthName(new Date().toISOString())}
              </motion.p>
              <motion.h1
                className="text-[28px] font-bold text-text-primary tracking-tight"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Halo, Rangga 👋
              </motion.h1>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/advisor"
                onClick={() => haptic('light')}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-accent-secondary/15 text-accent-secondary active:scale-95 transition-transform"
                aria-label="Tanya DicatetinAja AI"
              >
                <Robot size={20} weight="fill" />
              </Link>
              <StreakFlame />
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-5 pb-8">
        {/* Daily Budget Hero (PRD §5.7: "Hero pertama yang terlihat: Budget Harian") */}
        <motion.div
          className="rounded-[24px] bg-bg-elevated shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-5 border border-border-light text-center relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 200 }}
        >
          {dailyBudgetLimit === 0 ? (
            <div className="py-4">
              <span className="text-4xl">🎯</span>
              <h3 className="text-base font-bold text-text-primary mt-2">Atur Budget Harianmu!</h3>
              <p className="text-xs text-text-tertiary mt-1 mb-4 leading-relaxed max-w-[280px] mx-auto">
                Mulai atur limit belanja harian per kategori biar keuanganmu tetap terkontrol.
              </p>
              <button
                onClick={() => { haptic('light'); setShowBudgetSheet(true); }}
                className="px-5 py-2.5 rounded-xl bg-accent-secondary text-white text-xs font-bold active:scale-95 transition-all shadow-md"
              >
                Atur Budget Sekarang ✨
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="flex justify-between items-center w-full mb-3">
                <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                  Sisa Budget Hari Ini
                </span>
                <button
                  onClick={() => { haptic('light'); setShowBudgetSheet(true); }}
                  className="flex items-center gap-1 text-[11px] font-bold text-accent-secondary bg-accent-secondary/10 px-2.5 py-1 rounded-lg"
                >
                  <PencilSimple size={12} /> Atur
                </button>
              </div>

              {/* Progress Ring with Daily mascot */}
              <div className="relative my-2">
                <ProgressRing
                  percentage={dailyBudgetPct}
                  size={120}
                  strokeWidth={8}
                  color={remainingDailyBudget >= 0 ? "var(--accent-primary)" : "var(--accent-danger)"}
                >
                  <span className="text-4xl">🐷</span>
                </ProgressRing>
              </div>

              <h2 className={`text-2xl font-bold tabular-nums tracking-tight mt-3 ${
                remainingDailyBudget >= 0 ? 'text-text-primary' : 'text-accent-danger'
              }`}>
                {remainingDailyBudget >= 0
                  ? formatCurrency(remainingDailyBudget)
                  : `Boncos ${formatCurrency(Math.abs(remainingDailyBudget))}!`}
              </h2>

              <p className="text-[11px] text-text-tertiary mt-1 tabular-nums">
                Limit harian: {formatCurrency(dailyBudgetLimit)} · Terpakai: {formatCurrency(todayExpense)}
              </p>
            </div>
          )}
        </motion.div>

        {/* Accounting Net Worth Panel */}
        <motion.div
          className="rounded-[20px] bg-bg-elevated shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-4 border border-border-light"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">Kekayaan Bersih (Net Worth)</p>
              <h3 className="text-xl font-bold text-text-primary tabular-nums mt-0.5">
                {formatCurrency(netWorth)}
              </h3>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-accent-secondary/10 text-accent-secondary font-bold">
              Akuntansi 📊
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border-light text-center">
            <div>
              <p className="text-[9px] text-text-tertiary uppercase font-semibold">Aset (Saldo)</p>
              <p className="text-xs font-bold text-accent-primary tabular-nums mt-0.5">
                {formatCurrencyCompact(totalBalance)}
              </p>
            </div>
            <div className="border-x border-border-light">
              <p className="text-[9px] text-text-tertiary uppercase font-semibold">Piutang</p>
              <p className="text-xs font-bold text-accent-secondary tabular-nums mt-0.5">
                {formatCurrencyCompact(totalReceivables)}
              </p>
            </div>
            <div>
              <p className="text-[9px] text-text-tertiary uppercase font-semibold">Kewajiban</p>
              <p className="text-xs font-bold text-accent-danger tabular-nums mt-0.5">
                {formatCurrencyCompact(totalDebts)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Balance Card */}
        <motion.div
          className="relative overflow-hidden rounded-[20px] p-5 bg-gradient-to-br from-accent-secondary to-accent-primary text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 200 }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/5" />

          <p className="text-sm text-white/70 mb-1">Total Saldo</p>
          <h2 className="text-[32px] font-bold tabular-nums mb-4 tracking-tight">
            {formatCurrency(totalBalance)}
          </h2>

          {/* Wallet pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
            {wallets.map((wallet, index) => (
              <motion.div
                key={wallet.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl flex-shrink-0 transition-all ${
                  index === activeWalletIndex
                    ? 'bg-white/25 shadow-lg'
                    : 'bg-white/10'
                }`}
                onClick={() => setActiveWalletIndex(index)}
                whileTap={{ scale: 0.97 }}
              >
                <DynamicIcon name={wallet.icon} size={16} weight="fill" />
                <span className="text-xs font-medium whitespace-nowrap">{wallet.name}</span>
                <span className="text-xs font-bold tabular-nums">
                  {formatCurrencyCompact(wallet.balance)}
                </span>
              </motion.div>
            ))}
            <Link
              href="/wallets"
              onClick={() => haptic('light')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl flex-shrink-0 bg-white/10 text-white/90 active:scale-95 transition-all text-xs font-semibold"
            >
              <Plus size={14} weight="bold" />
              Kelola
            </Link>
          </div>

          {/* Income/Expense summary */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-white/15">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowUp size={16} weight="bold" />
              </div>
              <div>
                <p className="text-[11px] text-white/60">Pemasukan</p>
                <p className="text-sm font-bold tabular-nums">{formatCurrencyCompact(monthIncome)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowDown size={16} weight="bold" />
              </div>
              <div>
                <p className="text-[11px] text-white/60">Pengeluaran</p>
                <p className="text-sm font-bold tabular-nums">{formatCurrencyCompact(monthExpense)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* XP & Level Card */}
        <motion.div
          className="rounded-[14px] bg-bg-elevated shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-4">
            <ProgressRing
              percentage={levelProgress.percentage}
              size={56}
              strokeWidth={5}
              color="var(--gamify-gold)"
            >
              <span className="text-lg">🐷</span>
            </ProgressRing>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-text-primary">
                  Level {progress.level}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gamify-gold/15 text-gamify-gold font-semibold">
                  {getLevelTitle(progress.level)}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-bg-secondary overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gamify-gold"
                  initial={{ width: 0 }}
                  animate={{ width: `${levelProgress.percentage}%` }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.6 }}
                />
              </div>
              <p className="text-[11px] text-text-tertiary mt-1 tabular-nums">
                {levelProgress.current} / {levelProgress.required} XP
              </p>
            </div>
          </div>
        </motion.div>

        {/* Category Spending */}
        {categoryTotals.length > 0 && (
          <motion.div
            className="rounded-[14px] bg-bg-elevated shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold text-text-primary">Pengeluaran Bulan Ini</h3>
              <span className="text-xs text-text-tertiary">{getMonthName(new Date().toISOString())}</span>
            </div>

            <div className="flex items-center gap-4">
              <DonutChart data={chartData} size={100} />
              <div className="flex-1 space-y-2">
                {categoryTotals.slice(0, 4).map((ct) => (
                  <div key={ct.categoryId} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: ct.color }}
                    />
                    <span className="text-xs text-text-secondary flex-1 truncate">{ct.category}</span>
                    <span className="text-xs font-semibold text-text-primary tabular-nums">
                      {ct.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Highlight Card */}
        <motion.div
          className="rounded-[14px] bg-gradient-to-r from-accent-secondary/10 to-accent-primary/10 border border-accent-secondary/20 p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-secondary/20 flex items-center justify-center flex-shrink-0">
              <Sparkle size={20} weight="duotone" className="text-accent-secondary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-1">Highlight Minggu Ini</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                {monthExpense > 0
                  ? `Pengeluaran terbesar kamu bulan ini di kategori ${categoryTotals[0]?.category || 'belum ada'} (${categoryTotals[0]?.percentage || 0}%). `
                  : 'Belum ada pengeluaran bulan ini. '}
                {monthIncome > monthExpense
                  ? 'Bagus! Pemasukan masih lebih besar dari pengeluaran 💰'
                  : monthExpense > 0
                  ? 'Yuk kontrol pengeluaran biar lebih seimbang! 💪'
                  : 'Mulai catat transaksi pertamamu! 🚀'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-semibold text-text-primary">Transaksi Terakhir</h3>
            <a href="/transactions" className="flex items-center gap-0.5 text-xs text-accent-secondary font-medium">
              Lihat semua <CaretRight size={12} weight="bold" />
            </a>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">📝</p>
              <p className="text-sm text-text-secondary">Belum ada transaksi</p>
              <p className="text-xs text-text-tertiary mt-1">Tekan tombol + untuk mulai mencatat!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((tx, index) => (
                <motion.div
                  key={tx.id}
                  className="flex items-center gap-3 p-3 rounded-[14px] bg-bg-elevated shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                >
                  {/* Category icon */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: (tx.categoryData?.color || '#6B7280') + '20' }}
                  >
                    <DynamicIcon
                      name={tx.categoryData?.icon || 'DotsThree'}
                      size={20}
                      weight="duotone"
                      style={{ color: tx.categoryData?.color || '#6B7280' }}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {tx.categoryData?.name || 'Lainnya'}
                    </p>
                    <p className="text-xs text-text-tertiary truncate">
                      {tx.note || tx.walletData?.name || ''} · {formatRelativeDate(tx.date)}
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
              ))}
            </div>
          )}
        </motion.div>
      </div>
      <BudgetSettingsSheet isOpen={showBudgetSheet} onClose={() => setShowBudgetSheet(false)} />
    </div>
  );
}

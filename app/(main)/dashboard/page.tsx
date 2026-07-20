// ============================================
// Pundi — Dashboard Page
// ============================================

"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, Sparkle, CaretRight, Robot, Plus, PencilSimple, Bell, Cloud, CloudCheck, CloudSlash } from '@phosphor-icons/react';
import { StreakFlame } from '@/components/gamification/StreakFlame';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { DonutChart } from '@/components/charts/DonutChart';
import { BudgetSettingsSheet } from '@/components/budget/BudgetSettingsSheet';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { InsightsCarousel } from '@/components/insights/InsightsCarousel';
import { CashFlowForecastCard } from '@/components/intelligence/CashFlowForecastCard';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { useGamificationStore } from '@/lib/stores/gamification-store';
import { useBudgetStore } from '@/lib/stores/budget-store';
import { useDebtStore } from '@/lib/stores/debt-store';
import { useReceivableStore } from '@/lib/stores/receivable-store';
import { useRecurringStore } from '@/lib/stores/recurring-store';
import { useNotificationStore } from '@/lib/stores/notification-store';
import { useSyncStore } from '@/lib/stores/sync-store';
import { generateInsights } from '@/lib/insights/insights';
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils/currency';
import { getCurrentMonthRange, getMonthName, formatRelativeDate } from '@/lib/utils/date';
import { getLevelProgress, getLevelTitle } from '@/lib/gamification/xp';
import { haptic } from '@/lib/utils/haptic';

export default function DashboardPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [activeWalletIndex, setActiveWalletIndex] = useState(0);

  const { transactions, getCategoryTotals, getTotalByType } = useTransactionStore();
  const { wallets, getTotalBalance } = useWalletStore();
  const { progress } = useGamificationStore();
  const { checkAndTriggerRecurring, recurringTransactions } = useRecurringStore();
  const { generateNotifications, getUnreadCount } = useNotificationStore();
  const { isOnline, isSyncing, syncQueue } = useSyncStore();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    checkAndTriggerRecurring();
    generateNotifications();
    return () => clearTimeout(timer);
  }, [checkAndTriggerRecurring, generateNotifications]);

  const [showBudgetSheet, setShowBudgetSheet] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = getUnreadCount();

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
  
  const totalCCOutstanding = useMemo(() => {
    return wallets
      .filter(w => w.type === 'credit_card')
      .reduce((sum, w) => sum + (w.credit_outstanding || 0), 0);
  }, [wallets]);

  const totalReceivables = useReceivableStore((state) => state.getTotalReceivable());
  const totalDebts = useDebtStore((state) => state.getTotalDebt());
  const netWorth = totalBalance + totalReceivables - totalDebts - totalCCOutstanding;

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

  // Donut chart data — inline to avoid memoization dependency on mutable array
  const chartData = categoryTotals.slice(0, 6).map((ct) => ({
    name: ct.category,
    value: ct.amount,
    color: ct.color,
  }));

  // Financial insights
  const insights = useMemo(() => {
    const debtsData = useDebtStore.getState().getActiveDebts();
    const budgetsData = useBudgetStore.getState().budgets;
    const insightsCategories = useTransactionStore.getState().categories;
    return generateInsights(
      transactions,
      insightsCategories,
      budgetsData,
      debtsData,
      recurringTransactions,
      new Date(),
    );
  }, [transactions, insightsCategories, budgetsData, debtsData, recurringTransactions]);

  if (!mounted) {
    return <div className="min-h-screen bg-bg-primary" />;
  }

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
                className="text-[32px] font-extrabold text-text-primary tracking-tight"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Halo, Rangga 👋
              </motion.h1>
            </div>
            <div className="flex items-center gap-2">
              <AnimatePresence mode="wait">
                {mounted && (
                  !isOnline ? (
                    <motion.div
                      key="offline"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center justify-center w-9 h-9 rounded-full bg-accent-danger/10 text-accent-danger"
                      title="Offline - Menunggu Koneksi"
                    >
                      <CloudSlash size={18} weight="duotone" />
                    </motion.div>
                  ) : syncQueue.length > 0 || isSyncing ? (
                    <motion.div
                      key="syncing"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center justify-center w-9 h-9 rounded-full bg-accent-secondary/10 text-accent-secondary"
                      title="Sinkronisasi ke Cloud..."
                    >
                      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                        <Cloud size={18} weight="duotone" />
                      </motion.div>
                      {syncQueue.length > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-accent-secondary text-white text-[8px] font-bold flex items-center justify-center">
                          {syncQueue.length}
                        </span>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="synced"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center justify-center w-9 h-9 rounded-full bg-accent-primary/10 text-accent-primary"
                      title="Tersinkronisasi"
                    >
                      <CloudCheck size={18} weight="duotone" />
                    </motion.div>
                  )
                )}
              </AnimatePresence>

              <button
                onClick={() => { setShowNotifications(true); haptic('light'); }}
                className="relative flex items-center justify-center w-9 h-9 rounded-full bg-accent-warning/15 text-accent-warning active:scale-95 transition-transform"
                aria-label="Notifikasi"
              >
                <Bell size={20} weight="fill" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent-danger text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
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

      <div className="px-5 space-y-6 pb-24">
        {/* Balance Card - PREMIUM AI REDESIGN */}
        <motion.div
          className="relative overflow-hidden rounded-[28px] p-6 bg-gradient-to-br from-[#6366F1] via-[#A855F7] to-[#EC4899] text-white shadow-ai-glow mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 200 }}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />

          <div className="relative z-10">
            <p className="text-sm font-medium text-white/80 mb-1 tracking-wide uppercase">Total Kekayaan Bersih</p>
            <h2 className="text-[38px] font-black tabular-nums tracking-tighter leading-none mb-6">
              {formatCurrency(netWorth)}
            </h2>

            {/* Income/Expense summary */}
            <div className="flex gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center">
                  <ArrowUp size={20} weight="bold" className="text-[#34D369]" />
                </div>
                <div>
                  <p className="text-[10px] text-white/70 uppercase font-semibold">Pemasukan</p>
                  <p className="text-sm font-bold tabular-nums">{formatCurrencyCompact(monthIncome)}</p>
                </div>
              </div>
              <div className="w-[1px] bg-white/15" />
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center">
                  <ArrowDown size={20} weight="bold" className="text-[#F87171]" />
                </div>
                <div>
                  <p className="text-[10px] text-white/70 uppercase font-semibold">Pengeluaran</p>
                  <p className="text-sm font-bold tabular-nums">{formatCurrencyCompact(monthExpense)}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Kantong Saya (Wallets Section) - Refined */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-bold text-text-primary">Kantong Saya</h3>
            <Link href="/wallets" className="text-xs font-semibold text-accent-secondary" onClick={() => haptic('light')}>
              Kelola
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2">
            {wallets.map((wallet) => (
              <Link
                href="/wallets"
                key={wallet.id}
                onClick={() => haptic('light')}
                className="flex flex-col min-w-[140px] p-3.5 rounded-2xl bg-bg-elevated shadow-card active:scale-95 transition-all border border-border-light"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-xl text-white shadow-sm" style={{ backgroundColor: wallet.color }}>
                    <DynamicIcon name={wallet.icon} size={18} weight="fill" />
                  </div>
                  {wallet.type === 'credit_card' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-secondary text-text-secondary font-bold">CC</span>}
                </div>
                <div className="mt-auto">
                  <span className="text-xs font-semibold text-text-primary truncate block mb-0.5">{wallet.name}</span>
                  <p className="text-sm font-bold text-text-primary tabular-nums">
                    {wallet.type === 'credit_card' 
                      ? formatCurrencyCompact(wallet.credit_outstanding || 0) 
                      : formatCurrencyCompact(wallet.balance)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Daily Budget Hero - Glass effect */}
        <motion.div
          className="rounded-[24px] glass shadow-elevated p-6 border border-border-light text-center relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 200 }}
        >
          {dailyBudgetLimit === 0 ? (
            <div className="py-4">
              <span className="text-5xl drop-shadow-md">🎯</span>
              <h3 className="text-lg font-bold text-text-primary mt-3">Atur Budget Harianmu!</h3>
              <p className="text-xs text-text-secondary mt-2 mb-5 leading-relaxed max-w-[280px] mx-auto">
                Mulai atur limit belanja harian per kategori biar keuanganmu tetap terkontrol.
              </p>
              <button
                onClick={() => { haptic('light'); setShowBudgetSheet(true); }}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-br from-[#6366F1] via-[#A855F7] to-[#EC4899] text-white text-sm font-bold active:scale-95 transition-all shadow-ai-glow"
              >
                Atur Budget Sekarang ✨
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="flex justify-between items-center w-full mb-4">
                <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest">
                  Sisa Budget Hari Ini
                </span>
                <button
                  onClick={() => { haptic('light'); setShowBudgetSheet(true); }}
                  className="flex items-center gap-1 text-[11px] font-bold text-accent-secondary bg-accent-secondary/10 px-3 py-1.5 rounded-xl hover:bg-accent-secondary/20 transition-colors"
                >
                  <PencilSimple size={14} weight="bold" /> Atur
                </button>
              </div>

              {/* Progress Ring with Daily mascot */}
              <div className="relative my-2 drop-shadow-lg">
                <ProgressRing
                  percentage={dailyBudgetPct}
                  size={140}
                  strokeWidth={10}
                  color={remainingDailyBudget >= 0 ? "var(--accent-primary)" : "var(--accent-danger)"}
                >
                  <span className="text-5xl drop-shadow-sm">🐷</span>
                </ProgressRing>
              </div>

              <h2 className={`text-3xl font-black tabular-nums tracking-tighter mt-4 ${
                remainingDailyBudget >= 0 ? 'text-text-primary' : 'text-accent-danger'
              }`}>
                {remainingDailyBudget >= 0
                  ? formatCurrency(remainingDailyBudget)
                  : `Boncos ${formatCurrency(Math.abs(remainingDailyBudget))}!`}
              </h2>

              <div className="flex items-center gap-3 mt-3 px-4 py-2 rounded-xl bg-bg-secondary text-[11px] font-medium text-text-secondary">
                <span>Limit: {formatCurrencyCompact(dailyBudgetLimit)}</span>
                <span className="w-1 h-1 rounded-full bg-border-medium" />
                <span>Pakai: {formatCurrencyCompact(todayExpense)}</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* AI Financial Forecast Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
              <Sparkle weight="fill" className="text-ai-mid" /> AI Forecast
            </h3>
          </div>
          <CashFlowForecastCard />
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
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-semibold text-text-primary">Pengeluaran Bulan Ini</h3>
              <span className="text-xs text-text-tertiary font-medium bg-bg-secondary px-2 py-1 rounded-md">{getMonthName(new Date().toISOString())}</span>
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

        {/* Financial Insights Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-semibold text-text-primary">Insight Keuangan ✨</h3>
          </div>
          <InsightsCarousel insights={insights} />
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
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-bg-elevated shadow-card border border-border-light"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                >
                  {/* Category icon */}
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: (tx.categoryData?.color || '#6B7280') + '15' }}
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
      <NotificationCenter isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </div>
  );
}

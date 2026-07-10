// ============================================
// Pundi — Transactions List Page
// ============================================

"use client";
// ============================================
// Pundi — Transactions List Page
// ============================================

"use client";

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Trash, MagnifyingGlass, Plus, SlidersHorizontal, X } from '@phosphor-icons/react';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { AddTransactionSheet } from '@/components/transactions/AddTransactionSheet';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate, formatRelativeDate, getCurrentMonthRange, getCurrentWeekRange, getToday } from '@/lib/utils/date';
import { haptic } from '@/lib/utils/haptic';

type DateMode = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';

function TransactionsListContent() {
  const [search, setSearch] = useState('');
  const [swipedId, setSwipedId] = useState<string | null>(null);

  // Active filter state
  const [dateMode, setDateMode] = useState<DateMode>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [selectedWalletFilter, setSelectedWalletFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // Filter Bottom Sheet open state
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Temporary filter state for Bottom Sheet (applies only on "Terapkan")
  const [tempDateMode, setTempDateMode] = useState<DateMode>('month');
  const [tempStartDate, setTempStartDate] = useState<string>('');
  const [tempEndDate, setTempEndDate] = useState<string>('');
  const [tempType, setTempType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [tempWalletId, setTempWalletId] = useState<string>('all');
  const [tempCategoryId, setTempCategoryId] = useState<string>('all');
  const [tempSortBy, setTempSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // Edit mode
  const [editTransactionId, setEditTransactionId] = useState<string | undefined>(undefined);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  const { transactions, categories, deleteTransaction } = useTransactionStore();
  const { wallets, updateBalance } = useWalletStore();
  const searchParams = useSearchParams();

  // Sync temp state with active state when bottom sheet opens
  React.useEffect(() => {
    if (isFilterSheetOpen) {
      const timer = setTimeout(() => {
        setTempDateMode(dateMode);
        setTempStartDate(startDate);
        setTempEndDate(endDate);
        setTempType(transactionTypeFilter);
        setTempWalletId(selectedWalletFilter);
        setTempCategoryId(selectedCategoryFilter);
        setTempSortBy(sortBy);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isFilterSheetOpen, dateMode, startDate, endDate, transactionTypeFilter, selectedWalletFilter, selectedCategoryFilter, sortBy]);

  // Handle query parameter for wallet link (e.g. from Wallets page)
  React.useEffect(() => {
    const walletId = searchParams.get('walletId');
    if (walletId) {
      const timer = setTimeout(() => {
        setSelectedWalletFilter(walletId);
        setTempWalletId(walletId);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Apply filters
  const applyFilters = () => {
    haptic('medium');
    setDateMode(tempDateMode);
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setTransactionTypeFilter(tempType);
    setSelectedWalletFilter(tempWalletId);
    setSelectedCategoryFilter(tempCategoryId);
    setSortBy(tempSortBy);
    setIsFilterSheetOpen(false);
  };

  // Reset filters
  const resetFilters = () => {
    haptic('light');
    setTempDateMode('all');
    setTempStartDate('');
    setTempEndDate('');
    setTempType('all');
    setTempWalletId('all');
    setTempCategoryId('all');
    setTempSortBy('date_desc');

    setDateMode('all');
    setStartDate('');
    setEndDate('');
    setTransactionTypeFilter('all');
    setSelectedWalletFilter('all');
    setSelectedCategoryFilter('all');
    setSortBy('date_desc');
  };

  // Count active filters (not default)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (dateMode !== 'all') count++;
    if (transactionTypeFilter !== 'all') count++;
    if (selectedWalletFilter !== 'all') count++;
    if (selectedCategoryFilter !== 'all') count++;
    if (sortBy !== 'date_desc') count++;
    return count;
  }, [dateMode, transactionTypeFilter, selectedWalletFilter, selectedCategoryFilter, sortBy]);

  // Filter Categories for the bottom sheet depending on selected transaction type
  const filteredTempCategories = useMemo(() => {
    if (tempType === 'all') return categories;
    return categories.filter((c) => c.type === tempType);
  }, [categories, tempType]);

  // Filter by period & other filters
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // 1. Filter by Date Mode / Date Range
    let start = '';
    let end = '';

    if (dateMode === 'today') {
      const today = getToday();
      start = today;
      end = today;
    } else if (dateMode === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      start = yesterdayStr;
      end = yesterdayStr;
    } else if (dateMode === 'week') {
      const range = getCurrentWeekRange();
      start = range.start;
      end = range.end;
    } else if (dateMode === 'month') {
      const range = getCurrentMonthRange();
      start = range.start;
      end = range.end;
    } else if (dateMode === 'custom') {
      start = startDate;
      end = endDate;
    }

    if (start || end) {
      filtered = filtered.filter((tx) => {
        const d = tx.date.split('T')[0];
        if (start && end) {
          return d >= start && d <= end;
        } else if (start) {
          return d >= start;
        } else if (end) {
          return d <= end;
        }
        return true;
      });
    }

    // 2. Filter by Wallet
    if (selectedWalletFilter !== 'all') {
      filtered = filtered.filter(
        (tx) => tx.wallet_id === selectedWalletFilter || tx.target_wallet_id === selectedWalletFilter
      );
    }

    // 3. Filter by Transaction Type
    if (transactionTypeFilter !== 'all') {
      filtered = filtered.filter((tx) => tx.type === transactionTypeFilter);
    }

    // 4. Filter by Category
    if (selectedCategoryFilter !== 'all') {
      filtered = filtered.filter((tx) => tx.category_id === selectedCategoryFilter);
    }

    // 5. Search query (includes category name, note, amount, wallet name)
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((tx) => {
        const cat = categories.find((c) => c.id === tx.category_id);
        const wallet = wallets.find((w) => w.id === tx.wallet_id);
        const targetWallet = tx.target_wallet_id ? wallets.find((w) => w.id === tx.target_wallet_id) : null;
        return (
          cat?.name.toLowerCase().includes(q) ||
          tx.note?.toLowerCase().includes(q) ||
          tx.amount.toString().includes(q) ||
          wallet?.name.toLowerCase().includes(q) ||
          targetWallet?.name.toLowerCase().includes(q)
        );
      });
    }

    // 6. Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === 'date_asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'amount_desc') {
        return b.amount - a.amount;
      } else { // amount_asc
        return a.amount - b.amount;
      }
    });

    return filtered;
  }, [
    transactions,
    categories,
    wallets,
    search,
    dateMode,
    startDate,
    endDate,
    selectedWalletFilter,
    transactionTypeFilter,
    selectedCategoryFilter,
    sortBy,
  ]);

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
    } else if (tx.type === 'transfer' && tx.target_wallet_id) {
      updateBalance(tx.wallet_id, tx.amount); // return to source
      updateBalance(tx.target_wallet_id, -tx.amount); // take back from target
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

          {/* Quick Period Segmented Control */}
          <div className="flex gap-1 p-1 rounded-xl bg-bg-secondary mb-3">
            {[
              { id: 'week' as DateMode, label: 'Minggu' },
              { id: 'month' as DateMode, label: 'Bulan' },
              { id: 'all' as DateMode, label: 'Semua' },
            ].map((seg) => (
              <button
                key={seg.id}
                onClick={() => { haptic('light'); setDateMode(seg.id); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  dateMode === seg.id
                    ? 'bg-bg-elevated text-text-primary shadow-sm'
                    : 'text-text-tertiary'
                }`}
              >
                {seg.label}
              </button>
            ))}
          </div>

          {/* Search & Filter Trigger */}
          <div className="flex gap-2 mb-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-bg-secondary">
              <MagnifyingGlass size={18} className="text-text-tertiary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari transaksi..."
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
              />
            </div>

            <button
              onClick={() => { haptic('light'); setIsFilterSheetOpen(true); }}
              className={`relative flex items-center justify-center p-3 rounded-xl bg-bg-secondary text-text-primary active:scale-95 transition-all ${
                activeFiltersCount > 0 ? 'text-accent-secondary bg-accent-secondary/10' : ''
              }`}
              aria-label="Filter"
            >
              <SlidersHorizontal size={20} weight="bold" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent-secondary text-white text-[10px] font-bold flex items-center justify-center border-2 border-bg-primary">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Quick Filter Chips */}
          {activeFiltersCount > 0 && (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 pt-0.5">
              {/* Date Mode Chip */}
              {dateMode !== 'all' && (
                <button
                  onClick={() => {
                    haptic('light');
                    setDateMode('all');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-secondary/10 text-accent-secondary text-xs font-semibold whitespace-nowrap active:scale-95 transition-all"
                >
                  <span>
                    📅{' '}
                    {dateMode === 'today'
                      ? 'Hari Ini'
                      : dateMode === 'yesterday'
                      ? 'Kemarin'
                      : dateMode === 'week'
                      ? 'Minggu Ini'
                      : dateMode === 'month'
                      ? 'Bulan Ini'
                      : startDate && endDate
                      ? `${formatDate(startDate)} - ${formatDate(endDate)}`
                      : startDate
                      ? `>= ${formatDate(startDate)}`
                      : endDate
                      ? `<= ${formatDate(endDate)}`
                      : 'Kustom'}
                  </span>
                  <X size={12} weight="bold" />
                </button>
              )}

              {/* Type Chip */}
              {transactionTypeFilter !== 'all' && (
                <button
                  onClick={() => {
                    haptic('light');
                    setTransactionTypeFilter('all');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-secondary/10 text-accent-secondary text-xs font-semibold whitespace-nowrap active:scale-95 transition-all"
                >
                  <span>
                    📌{' '}
                    {transactionTypeFilter === 'income'
                      ? 'Pemasukan'
                      : transactionTypeFilter === 'expense'
                      ? 'Pengeluaran'
                      : 'Transfer'}
                  </span>
                  <X size={12} weight="bold" />
                </button>
              )}

              {/* Wallet Chip */}
              {selectedWalletFilter !== 'all' && (
                <button
                  onClick={() => {
                    haptic('light');
                    setSelectedWalletFilter('all');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-secondary/10 text-accent-secondary text-xs font-semibold whitespace-nowrap active:scale-95 transition-all"
                >
                  <span>
                    👛 {wallets.find((w) => w.id === selectedWalletFilter)?.name || 'Kantong'}
                  </span>
                  <X size={12} weight="bold" />
                </button>
              )}

              {/* Category Chip */}
              {selectedCategoryFilter !== 'all' && (
                <button
                  onClick={() => {
                    haptic('light');
                    setSelectedCategoryFilter('all');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-secondary/10 text-accent-secondary text-xs font-semibold whitespace-nowrap active:scale-95 transition-all"
                >
                  <span>
                    🏷️ {categories.find((c) => c.id === selectedCategoryFilter)?.name || 'Kategori'}
                  </span>
                  <X size={12} weight="bold" />
                </button>
              )}

              {/* Sort Chip */}
              {sortBy !== 'date_desc' && (
                <button
                  onClick={() => {
                    haptic('light');
                    setSortBy('date_desc');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-secondary/10 text-accent-secondary text-xs font-semibold whitespace-nowrap active:scale-95 transition-all"
                >
                  <span>
                    🔃{' '}
                    {sortBy === 'date_asc'
                      ? 'Terlama'
                      : sortBy === 'amount_desc'
                      ? 'Terbesar'
                      : 'Terkecil'}
                  </span>
                  <X size={12} weight="bold" />
                </button>
              )}

              {/* Clear All Button */}
              <button
                onClick={resetFilters}
                className="text-xs font-medium text-text-secondary px-2.5 py-1 hover:text-accent-danger transition-colors whitespace-nowrap"
              >
                Hapus Semua
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Transaction List */}
      <div className="px-5 pb-24">
        {grouped.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm text-text-secondary">Belum ada transaksi</p>
            <p className="text-xs text-text-tertiary mt-1">
              Sesuaikan pencarian atau filter kamu!
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
                  {txs.map((tx) => {
                    const cat = categories.find((c) => c.id === tx.category_id);
                    const wallet = wallets.find((w) => w.id === tx.wallet_id);
                    const targetWallet = tx.target_wallet_id ? wallets.find((w) => w.id === tx.target_wallet_id) : null;
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
                          className="relative flex items-center gap-3 p-3 bg-bg-elevated shadow-[0_2px_12px_rgba(0,0,0,0.06)] rounded-[14px] cursor-pointer"
                          onClick={() => {
                            setEditTransactionId(tx.id);
                            setIsAddSheetOpen(true);
                          }}
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
                          animate={{ x: isSwiped ? -80 : 0, opacity: 1, y: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          initial={{ opacity: 0, y: 10 }}
                        >
                          {/* Category icon */}
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: (cat?.color || '#6B7280') + '20' }}
                          >
                            <DynamicIcon
                              name={tx.type === 'transfer' ? 'ArrowsLeftRight' : (cat?.icon || 'DotsThree')}
                              size={20}
                              weight="duotone"
                              style={{ color: tx.type === 'transfer' ? '#6366F1' : (cat?.color || '#6B7280') }}
                            />
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">
                              {tx.type === 'transfer' ? 'Transfer Saldo' : (cat?.name || 'Lainnya')}
                            </p>
                            <p className="text-xs text-text-tertiary truncate">
                              {tx.type === 'transfer'
                                ? `Dari ${wallet?.name || 'Kantong'} ke ${targetWallet?.name || 'Kantong'}`
                                : (tx.note || wallet?.name || '')}
                            </p>
                          </div>

                          {/* Amount */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {tx.type === 'income' ? (
                              <ArrowUp size={12} weight="bold" className="text-accent-primary" />
                            ) : tx.type === 'expense' ? (
                              <ArrowDown size={12} weight="bold" className="text-accent-danger" />
                            ) : (
                              <span className="text-xs text-text-tertiary">⇆</span>
                            )}
                            <span
                              className={`text-sm font-bold tabular-nums ${
                                tx.type === 'income'
                                  ? 'text-accent-primary'
                                  : tx.type === 'expense'
                                  ? 'text-text-primary'
                                  : 'text-text-secondary'
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

      <AddTransactionSheet
        isOpen={isAddSheetOpen}
        onClose={() => {
          setIsAddSheetOpen(false);
          setEditTransactionId(undefined);
        }}
        editTransactionId={editTransactionId}
      />

      {/* Advanced Filter Bottom Sheet */}
      <BottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="Filter Lanjutan"
      >
        <div className="p-5 space-y-6">
          {/* 1. Date Period */}
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase mb-2 block">
              Rentang Tanggal
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'all' as DateMode, label: 'Semua' },
                { id: 'today' as DateMode, label: 'Hari Ini' },
                { id: 'yesterday' as DateMode, label: 'Kemarin' },
                { id: 'week' as DateMode, label: 'Minggu Ini' },
                { id: 'month' as DateMode, label: 'Bulan Ini' },
                { id: 'custom' as DateMode, label: 'Kustom' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    haptic('light');
                    setTempDateMode(m.id);
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-medium text-center transition-all ${
                    tempDateMode === m.id
                      ? 'bg-accent-secondary text-white shadow-sm'
                      : 'bg-bg-secondary text-text-secondary'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {tempDateMode === 'custom' && (
              <div className="grid grid-cols-2 gap-3 mt-3 animate-slide-down">
                <div>
                  <span className="text-[10px] text-text-tertiary font-medium mb-1 block">Mulai Tanggal</span>
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-bg-secondary text-text-primary text-sm border-0 outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-text-tertiary font-medium mb-1 block">Sampai Tanggal</span>
                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-bg-secondary text-text-primary text-sm border-0 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Type */}
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase mb-2 block">
              Tipe Transaksi
            </label>
            <div className="flex gap-1.5 p-1 rounded-xl bg-bg-secondary">
              {[
                { id: 'all' as const, label: 'Semua' },
                { id: 'expense' as const, label: 'Pengeluaran' },
                { id: 'income' as const, label: 'Pemasukan' },
                { id: 'transfer' as const, label: 'Transfer' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    haptic('light');
                    setTempType(t.id);
                    setTempCategoryId('all'); // reset category since categories are type-dependent
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    tempType === t.id
                      ? 'bg-bg-elevated text-text-primary shadow-sm'
                      : 'text-text-tertiary'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Wallet */}
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase mb-2 block">
              Kantong
            </label>
            <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-1">
              <button
                onClick={() => {
                  haptic('light');
                  setTempWalletId('all');
                }}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  tempWalletId === 'all'
                    ? 'bg-accent-secondary text-white shadow-sm'
                    : 'bg-bg-secondary text-text-secondary'
                }`}
              >
                Semua
              </button>
              {wallets.map((w) => (
                <button
                  key={w.id}
                  onClick={() => {
                    haptic('light');
                    setTempWalletId(w.id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    tempWalletId === w.id
                      ? 'bg-accent-secondary text-white shadow-sm'
                      : 'bg-bg-secondary text-text-secondary'
                  }`}
                >
                  <DynamicIcon name={w.icon} size={14} />
                  {w.name}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Category */}
          {tempType !== 'transfer' && (
            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase mb-2 block">
                Kategori
              </label>
              <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto pr-1">
                <button
                  onClick={() => {
                    haptic('light');
                    setTempCategoryId('all');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    tempCategoryId === 'all'
                      ? 'bg-accent-secondary text-white shadow-sm'
                      : 'bg-bg-secondary text-text-secondary'
                }`}
              >
                Semua
              </button>
              {filteredTempCategories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    haptic('light');
                    setTempCategoryId(c.id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    tempCategoryId === c.id
                      ? 'bg-accent-secondary text-white shadow-sm'
                      : 'bg-bg-secondary text-text-secondary'
                  }`}
                >
                  <DynamicIcon name={c.icon} size={14} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          )}

          {/* 5. Sort Order */}
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase mb-2 block">
              Urutan
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'date_desc' as const, label: '📅 Terbaru' },
                { id: 'date_asc' as const, label: '📅 Terlama' },
                { id: 'amount_desc' as const, label: '🪙 Nominal Terbesar' },
                { id: 'amount_asc' as const, label: '🪙 Nominal Terkecil' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    haptic('light');
                    setTempSortBy(s.id);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-medium text-left transition-all ${
                    tempSortBy === s.id
                      ? 'bg-accent-secondary text-white shadow-sm'
                      : 'bg-bg-secondary text-text-secondary'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                resetFilters();
                setIsFilterSheetOpen(false);
              }}
              className="flex-1 py-3.5 rounded-2xl bg-bg-secondary text-text-secondary font-semibold text-sm active:scale-[0.98] transition-transform text-center"
            >
              Reset
            </button>
            <button
              onClick={applyFilters}
              className="flex-1 py-3.5 rounded-2xl bg-accent-primary text-white font-semibold text-sm active:scale-[0.98] transition-transform text-center shadow-[0_4px_15px_rgba(34,197,94,0.25)]"
            >
              Terapkan
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-primary" />}>
      <TransactionsListContent />
    </Suspense>
  );
}

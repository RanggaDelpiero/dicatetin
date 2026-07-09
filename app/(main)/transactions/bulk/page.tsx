// ============================================
// Pundi — Bulk Transaction Entry Page
// ============================================

"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CaretLeft, Plus, Trash, Check } from '@phosphor-icons/react';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { useGamificationStore } from '@/lib/stores/gamification-store';
import { formatCurrency } from '@/lib/utils/currency';
import { getToday } from '@/lib/utils/date';
import { haptic } from '@/lib/utils/haptic';
import { XP_REWARDS } from '@/lib/gamification/xp';

interface BulkRow {
  id: string;
  categoryId: string;
  note: string;
  amount: string;
  walletId: string;
}

export default function BulkTransactionPage() {
  const router = useRouter();
  const { categories, addTransaction } = useTransactionStore();
  const { wallets, updateBalance } = useWalletStore();
  const { addXP, recordActivity } = useGamificationStore();

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories]
  );

  // Initial state with 3 empty rows
  const [rows, setRows] = useState<BulkRow[]>([
    { id: '1', categoryId: expenseCategories[0]?.id || '', note: '', amount: '', walletId: wallets[0]?.id || '' },
    { id: '2', categoryId: expenseCategories[0]?.id || '', note: '', amount: '', walletId: wallets[0]?.id || '' },
    { id: '3', categoryId: expenseCategories[0]?.id || '', note: '', amount: '', walletId: wallets[0]?.id || '' },
  ]);

  const [globalWalletId, setGlobalWalletId] = useState(wallets[0]?.id || '');
  const [globalCategoryId, setGlobalCategoryId] = useState(expenseCategories[0]?.id || '');

  // Add row
  const addRow = () => {
    haptic('light');
    setRows([
      ...rows,
      {
        id: Date.now().toString(),
        categoryId: globalCategoryId,
        note: '',
        amount: '',
        walletId: globalWalletId,
      },
    ]);
  };

  // Remove row
  const removeRow = (id: string) => {
    haptic('medium');
    setRows(rows.filter((r) => r.id !== id));
  };

  // Update field
  const updateRow = (id: string, field: keyof BulkRow, value: string) => {
    setRows(
      rows.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // Apply default wallet to all rows
  const applyGlobalWallet = (walletId: string) => {
    haptic('light');
    setGlobalWalletId(walletId);
    setRows(rows.map((r) => ({ ...r, walletId })));
  };

  // Apply default category to all rows
  const applyGlobalCategory = (categoryId: string) => {
    haptic('light');
    setGlobalCategoryId(categoryId);
    setRows(rows.map((r) => ({ ...r, categoryId })));
  };

  // Sum of all valid rows
  const totalAmount = useMemo(() => {
    return rows.reduce((sum, r) => {
      const val = parseInt(r.amount, 10) || 0;
      return sum + val;
    }, 0);
  }, [rows]);

  const isValid = useMemo(() => {
    const validRows = rows.filter((r) => (parseInt(r.amount, 10) || 0) > 0);
    return validRows.length > 0;
  }, [rows]);

  const handleSave = () => {
    const validRows = rows.filter((r) => {
      const amt = parseInt(r.amount, 10) || 0;
      return amt > 0 && r.categoryId && r.walletId;
    });

    if (validRows.length === 0) {
      haptic('error');
      return;
    }

    haptic('success');

    // Save each row as a transaction
    validRows.forEach((r) => {
      const amt = parseInt(r.amount, 10);
      addTransaction({
        type: 'expense',
        amount: amt,
        category_id: r.categoryId,
        wallet_id: r.walletId,
        date: getToday(),
        note: r.note || undefined,
      });

      // Update wallet balance
      updateBalance(r.walletId, -amt);
    });

    // Gamification rewards
    const xpEarned = validRows.length * XP_REWARDS.ADD_BULK_ENTRY;
    addXP(xpEarned);
    recordActivity();

    router.back();
  };

  return (
    <div className="flex flex-col h-screen bg-bg-primary pb-safe">
      {/* Header */}
      <div className="pt-safe border-b border-border-light bg-bg-elevated sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => { haptic('light'); router.back(); }}
            className="w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center text-text-primary active:scale-95 transition-transform"
          >
            <CaretLeft size={20} weight="bold" />
          </button>
          <h2 className="text-sm font-semibold text-text-primary">Catat Massal / Bulk</h2>
          <div className="w-8" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 scroll-touch">
        {/* Global Settings */}
        <div className="bg-bg-elevated p-4 rounded-2xl shadow-sm border border-border-light space-y-3">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
            Pengaturan Cepat (Terapkan ke Semua)
          </h3>
          <div className="space-y-2">
            <div>
              <p className="text-[11px] text-text-tertiary mb-1.5">Kantong Default</p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {wallets.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => applyGlobalWallet(w.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                      globalWalletId === w.id
                        ? 'bg-accent-secondary text-white'
                        : 'bg-bg-secondary text-text-secondary'
                    }`}
                  >
                    <DynamicIcon name={w.icon} size={14} />
                    {w.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] text-text-tertiary mb-1.5">Kategori Default</p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {expenseCategories.slice(0, 6).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => applyGlobalCategory(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                      globalCategoryId === c.id
                        ? 'bg-accent-secondary text-white'
                        : 'bg-bg-secondary text-text-secondary'
                    }`}
                  >
                    <DynamicIcon name={c.icon} size={14} />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Rows */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Daftar Barang Belanjaan
            </h3>
            <span className="text-xs text-text-tertiary font-medium">
              {rows.length} baris
            </span>
          </div>

          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {rows.map((row, index) => (
                <motion.div
                  key={row.id}
                  className="bg-bg-elevated p-3 rounded-2xl shadow-sm border border-border-light space-y-2 relative"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  {/* Category, note, amount row */}
                  <div className="flex gap-2 items-center">
                    <span className="text-xs font-bold text-text-tertiary w-5">
                      #{index + 1}
                    </span>

                    {/* Category Selector */}
                    <select
                      value={row.categoryId}
                      onChange={(e) => updateRow(row.id, 'categoryId', e.target.value)}
                      className="bg-bg-secondary text-xs text-text-primary font-medium px-2 py-1.5 rounded-lg border-0 outline-none max-w-[120px]"
                    >
                      {expenseCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    {/* Amount Input */}
                    <input
                      type="number"
                      value={row.amount}
                      onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                      placeholder="Jumlah"
                      className="flex-1 min-w-[70px] bg-bg-secondary text-xs text-text-primary font-bold px-2.5 py-1.5 rounded-lg border-0 outline-none tabular-nums"
                    />

                    {/* Remove Button */}
                    {rows.length > 1 && (
                      <button
                        onClick={() => removeRow(row.id)}
                        className="p-1.5 rounded-lg bg-accent-danger/10 text-accent-danger active:scale-95"
                      >
                        <Trash size={14} />
                      </button>
                    )}
                  </div>

                  {/* Note & Wallet Row */}
                  <div className="flex gap-2 items-center pl-7">
                    {/* Note Input */}
                    <input
                      type="text"
                      value={row.note}
                      onChange={(e) => updateRow(row.id, 'note', e.target.value)}
                      placeholder="Nama barang / catatan"
                      className="flex-1 bg-bg-secondary text-xs text-text-primary px-2.5 py-1.5 rounded-lg border-0 outline-none"
                    />

                    {/* Wallet Selector */}
                    <select
                      value={row.walletId}
                      onChange={(e) => updateRow(row.id, 'walletId', e.target.value)}
                      className="bg-bg-secondary text-xs text-text-secondary px-2 py-1.5 rounded-lg border-0 outline-none max-w-[100px]"
                    >
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <button
            onClick={addRow}
            className="w-full py-3 rounded-xl border border-dashed border-border-medium hover:border-accent-secondary flex items-center justify-center gap-1.5 text-xs text-text-tertiary font-semibold hover:text-accent-secondary transition-colors"
          >
            <Plus size={14} weight="bold" />
            Tambah Baris Baru
          </button>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="p-4 bg-bg-elevated border-t border-border-light flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] text-text-tertiary">Total Pengeluaran</p>
          <p className="text-lg font-bold text-accent-danger tabular-nums">
            {formatCurrency(totalAmount)}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={!isValid}
          className={`px-6 py-3 rounded-xl font-semibold text-sm text-white flex items-center gap-1.5 shadow-md active:scale-95 transition-transform ${
            isValid
              ? 'bg-accent-primary shadow-[0_4px_15px_rgba(34,197,94,0.3)]'
              : 'bg-text-tertiary/30 cursor-not-allowed shadow-none'
          }`}
        >
          <Check size={16} weight="bold" />
          Simpan Semua
        </button>
      </div>
    </div>
  );
}

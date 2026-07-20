// ============================================
// Pundi — Recurring Transactions Management Page
// ============================================

"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowLeft, Plus, Trash, Clock, 
  ToggleLeft, ToggleRight, CalendarBlank, 
  Coins, ArrowsClockwise, Check 
} from '@phosphor-icons/react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { useRecurringStore, RecurringTransaction } from '@/lib/stores/recurring-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { haptic } from '@/lib/utils/haptic';

export default function RecurringTransactionsPage() {
  const { recurringTransactions, addRecurring, updateRecurring, deleteRecurring } = useRecurringStore();
  const { categories } = useTransactionStore();
  const { wallets } = useWalletStore();

  const [showAddSheet, setShowAddSheet] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  // Set default selects
  React.useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      const timer = setTimeout(() => setSelectedCategoryId(categories[0].id), 0);
      return () => clearTimeout(timer);
    }
  }, [categories, selectedCategoryId]);

  React.useEffect(() => {
    if (wallets.length > 0 && !selectedWalletId) {
      const timer = setTimeout(() => setSelectedWalletId(wallets[0].id), 0);
      return () => clearTimeout(timer);
    }
  }, [wallets, selectedWalletId]);

  const handleAdd = () => {
    const parsedAmount = parseInt(amount, 10);
    if (!name.trim() || !parsedAmount || parsedAmount <= 0 || !selectedCategoryId || !selectedWalletId) {
      haptic('error');
      alert('Mohon isi semua data dengan benar.');
      return;
    }

    haptic('success');
    addRecurring({
      name,
      amount: parsedAmount,
      type: 'expense', // default to expense
      category_id: selectedCategoryId,
      wallet_id: selectedWalletId,
      frequency,
      start_date: startDate,
      next_due_date: startDate, // starts due on start_date
      status: 'active',
      note,
    });

    // Reset form
    setName('');
    setAmount('');
    setNote('');
    setShowAddSheet(false);
  };

  const handleToggleStatus = (item: RecurringTransaction) => {
    haptic('light');
    const newStatus = item.status === 'active' ? 'paused' : 'active';
    updateRecurring(item.id, { status: newStatus });
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus transaksi berulang ini?')) {
      haptic('medium');
      deleteRecurring(id);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary pb-24">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-md border-b border-border-light px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            onClick={() => haptic('light')}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-bg-secondary text-text-primary active:scale-95 transition-transform"
          >
            <ArrowLeft size={18} weight="bold" />
          </Link>
          <h1 className="text-lg font-bold text-text-primary">Transaksi Berulang 🔄</h1>
        </div>
        <button
          onClick={() => { haptic('light'); setShowAddSheet(true); }}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-accent-secondary text-white active:scale-95 transition-transform shadow-md"
        >
          <Plus size={18} weight="bold" />
        </button>
      </div>

      <div className="px-5 mt-6 space-y-4">
        <p className="text-xs text-text-tertiary leading-relaxed">
          Kelola pembayaran rutin seperti langganan aplikasi (Spotify, Netflix), cicilan barang, tagihan internet, dll. DicatetinAja akan mencatat transaksi ini secara otomatis saat tanggal jatuh tempo tiba!
        </p>

        {recurringTransactions.length === 0 ? (
          <div className="text-center py-20 bg-bg-elevated rounded-[20px] border border-dashed border-border-medium p-6">
            <span className="text-5xl block mb-4">📅</span>
            <h3 className="text-base font-bold text-text-primary mb-1">Belum ada Transaksi Berulang</h3>
            <p className="text-xs text-text-tertiary max-w-[260px] mx-auto leading-relaxed mb-5">
              Tambah langganan atau tagihan rutin pertamamu dengan menekan tombol plus di kanan atas.
            </p>
            <button
              onClick={() => { haptic('light'); setShowAddSheet(true); }}
              className="px-5 py-2.5 rounded-xl bg-accent-secondary text-white text-xs font-semibold active:scale-95 transition-all shadow-md"
            >
              Tambah Baru 🚀
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recurringTransactions.map((item) => {
              const cat = categories.find((c) => c.id === item.category_id);
              const wallet = wallets.find((w) => w.id === item.wallet_id);

              return (
                <motion.div
                  key={item.id}
                  className={`p-4 rounded-[18px] bg-bg-elevated border transition-all flex items-center justify-between gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)] ${
                    item.status === 'active' ? 'border-border-light' : 'border-border-light opacity-60'
                  }`}
                  layout
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: (cat?.color || '#94A3B8') + '15' }}
                    >
                      <DynamicIcon
                        name={cat?.icon || 'ArrowsClockwise'}
                        size={20}
                        weight="duotone"
                        style={{ color: cat?.color || '#94A3B8' }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-text-primary truncate">{item.name}</h4>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-tertiary mt-0.5">
                        <span className="capitalize">{item.frequency === 'monthly' ? 'Bulanan' : item.frequency === 'weekly' ? 'Mingguan' : item.frequency === 'daily' ? 'Harian' : 'Tahunan'}</span>
                        <span>•</span>
                        <span>Jatuh tempo: {formatDate(item.next_due_date)}</span>
                        {wallet && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Coins size={12} /> {wallet.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <span className="text-sm font-bold text-text-primary tabular-nums block">
                        -{formatCurrency(item.amount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Status Toggle */}
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className="text-text-secondary hover:text-accent-secondary transition-colors"
                        title={item.status === 'active' ? 'Jeda' : 'Aktifkan'}
                      >
                        {item.status === 'active' ? (
                          <ToggleRight size={32} className="text-accent-secondary" weight="fill" />
                        ) : (
                          <ToggleLeft size={32} className="text-text-tertiary" />
                        )}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="w-8 h-8 rounded-lg bg-accent-danger/10 text-accent-danger flex items-center justify-center hover:bg-accent-danger/20 transition-all active:scale-90"
                      >
                        <Trash size={16} weight="bold" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Sheet */}
      <BottomSheet isOpen={showAddSheet} onClose={() => setShowAddSheet(false)} title="Tambah Transaksi Berulang">
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Nama Pengeluaran</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Spotify Premium, Netflix, Cicilan HP"
              className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-text-primary placeholder:text-text-tertiary outline-none text-sm border border-transparent focus:border-accent-secondary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Jumlah Tagihan (Rp)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-text-primary placeholder:text-text-tertiary outline-none text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Frekuensi</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly')}
                className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-text-primary outline-none text-sm"
              >
                <option value="daily">Harian</option>
                <option value="weekly">Mingguan</option>
                <option value="monthly">Bulanan</option>
                <option value="yearly">Tahunan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Kantong Pembayaran</label>
              <select
                value={selectedWalletId}
                onChange={(e) => setSelectedWalletId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-text-primary outline-none text-sm"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Tanggal Mulai / Tagihan</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-text-primary outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Kategori</label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-1 -mx-1">
              {categories.filter(c => c.type === 'expense').map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { haptic('light'); setSelectedCategoryId(cat.id); }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium flex-shrink-0 border transition-all ${
                    selectedCategoryId === cat.id
                      ? 'bg-accent-secondary/10 text-accent-secondary border-accent-secondary'
                      : 'bg-bg-secondary text-text-secondary border-transparent'
                  }`}
                >
                  <DynamicIcon name={cat.icon} size={14} weight="duotone" />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Catatan Tambahan (Opsional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan..."
              className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-text-primary placeholder:text-text-tertiary outline-none text-sm"
            />
          </div>

          <button
            onClick={handleAdd}
            className="w-full py-4 rounded-2xl bg-accent-secondary text-white font-bold text-sm active:scale-[0.98] transition-transform shadow-md mt-2 flex items-center justify-center gap-2"
          >
            <Check size={18} weight="bold" /> Simpan Transaksi Berulang
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}

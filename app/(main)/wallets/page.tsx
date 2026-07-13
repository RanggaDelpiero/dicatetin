// ============================================
// Pundi — Wallets Page
// ============================================

"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, PencilSimple, Trash } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { formatCurrency } from '@/lib/utils/currency';
import { getToday } from '@/lib/utils/date';
import { haptic } from '@/lib/utils/haptic';
import { getAvailableCredit, getCreditUsagePercentage, getCreditCardPaymentStatus } from '@/lib/finance/credit-card';
import type { WalletType } from '@/lib/types';

const WALLET_COLORS = ['#22C55E', '#3B82F6', '#00AED6', '#8B5CF6', '#EC4899', '#F97316', '#EF4444', '#10B981'];
const WALLET_ICONS = ['Money', 'Bank', 'DeviceMobile', 'CreditCard', 'Wallet', 'PiggyBank', 'ShieldCheck', 'Coin'];
const WALLET_TYPES: { id: WalletType; label: string }[] = [
  { id: 'cash', label: 'Cash' },
  { id: 'bank', label: 'Bank' },
  { id: 'ewallet', label: 'E-Wallet' },
  { id: 'credit_card', label: 'Kartu Kredit' },
  { id: 'emergency', label: 'Dana Darurat' },
  { id: 'investment', label: 'Investasi' },
  { id: 'other', label: 'Lainnya' },
];

export default function WalletsPage() {
  const router = useRouter();
  const { wallets, addWallet, deleteWallet, getTotalBalance, payCreditCardBill } = useWalletStore();
  const { addTransaction } = useTransactionStore();
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<WalletType>('cash');
  const [newColor, setNewColor] = useState(WALLET_COLORS[0]);
  const [newIcon, setNewIcon] = useState(WALLET_ICONS[0]);
  const [newBalance, setNewBalance] = useState('0');

  // CC States
  const [creditLimit, setCreditLimit] = useState('');
  const [creditOutstanding, setCreditOutstanding] = useState('');
  const [creditDueDate, setCreditDueDate] = useState('');
  const [creditStatementLabel, setCreditStatementLabel] = useState('');
  const [creditMinimumPayment, setCreditMinimumPayment] = useState('');
  const [creditAutoReset, setCreditAutoReset] = useState(false);

  // Pay Bill States
  const [payBillWalletId, setPayBillWalletId] = useState<string | null>(null);
  const [paySourceWalletId, setPaySourceWalletId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(getToday());
  const [payNote, setPayNote] = useState('');

  const handleAddWallet = () => {
    if (!newName.trim()) {
      haptic('error');
      return;
    }
    haptic('success');
    addWallet({
      name: newName,
      type: newType,
      balance: newType === 'credit_card' ? 0 : (parseInt(newBalance, 10) || 0),
      color: newColor,
      icon: newIcon,
      ...(newType === 'credit_card' && {
        credit_limit: parseInt(creditLimit, 10) || 0,
        credit_outstanding: parseInt(creditOutstanding, 10) || 0,
        credit_due_date: creditDueDate || undefined,
        credit_statement_label: creditStatementLabel || undefined,
        credit_minimum_payment: parseInt(creditMinimumPayment, 10) || 0,
        credit_auto_reset: creditAutoReset,
      }),
    });
    // Reset
    setNewName('');
    setNewBalance('0');
    setCreditLimit('');
    setCreditOutstanding('');
    setCreditDueDate('');
    setCreditStatementLabel('');
    setCreditMinimumPayment('');
    setCreditAutoReset(false);
    setShowAddSheet(false);
  };

  const handlePayBill = () => {
    const amount = parseInt(payAmount, 10);
    if (!payBillWalletId || !paySourceWalletId || isNaN(amount) || amount <= 0) {
      haptic('error');
      return;
    }
    
    payCreditCardBill({
      creditCardWalletId: payBillWalletId,
      sourceWalletId: paySourceWalletId,
      amount,
    });

    addTransaction({
      type: 'transfer',
      amount,
      wallet_id: paySourceWalletId,
      target_wallet_id: payBillWalletId,
      category_id: 'credit-card-payment',
      payment_kind: 'credit_card_payment',
      credit_card_wallet_id: payBillWalletId,
      note: payNote || 'Bayar tagihan kartu kredit',
      date: payDate,
    });

    haptic('success');
    setPayBillWalletId(null);
    setPayAmount('');
    setPayNote('');
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="pt-safe">
        <div className="px-5 pt-4 pb-3">
          <motion.h1
            className="text-[28px] font-bold text-text-primary tracking-tight"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Kantong
          </motion.h1>
          <motion.p
            className="text-sm text-text-secondary mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Total: <span className="font-bold text-text-primary tabular-nums">{formatCurrency(getTotalBalance())}</span>
          </motion.p>
        </div>
      </div>

      {/* Wallet Cards */}
      <div className="px-5 pb-8">
        <div className="space-y-3">
          {wallets.map((wallet, index) => (
            <motion.div
              key={wallet.id}
              className="relative overflow-hidden rounded-[20px] p-5"
              style={{
                background: `linear-gradient(135deg, ${wallet.color}, ${wallet.color}CC)`,
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Decorative */}
              <div
                className="absolute -top-6 -right-6 w-24 h-24 rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
              />
              <div
                className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
              />

              <div
                className="relative z-10 block cursor-pointer"
                onClick={() => {
                  haptic('light');
                  router.push(`/transactions?walletId=${wallet.id}`);
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <DynamicIcon name={wallet.icon} size={18} weight="fill" className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{wallet.name}</p>
                      <p className="text-[11px] text-white/60 capitalize">{wallet.type}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      haptic('medium');
                      if (confirm(`Hapus kantong "${wallet.name}"?`)) {
                        deleteWallet(wallet.id);
                      }
                    }}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <Trash size={14} weight="bold" className="text-white/70" />
                  </button>
                </div>

                {wallet.type === 'credit_card' ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-white/80 text-xs">Tagihan berjalan</p>
                      <p className="text-[28px] font-bold text-white tabular-nums tracking-tight leading-tight">
                        {formatCurrency(wallet.credit_outstanding || 0)}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/80 text-[11px]">Sisa Limit</p>
                        <p className="text-white font-medium text-sm tabular-nums">
                          {formatCurrency(getAvailableCredit(wallet.credit_limit, wallet.credit_outstanding))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/80 text-[11px]">Jatuh Tempo</p>
                        <div className="flex items-center gap-1 justify-end">
                          <p className="text-white font-medium text-sm">
                            {wallet.credit_due_date ? new Date(wallet.credit_due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                          </p>
                          {wallet.credit_due_date && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                              getCreditCardPaymentStatus(wallet.credit_due_date) === 'overdue' ? 'bg-red-500 text-white' :
                              getCreditCardPaymentStatus(wallet.credit_due_date) === 'due-soon' ? 'bg-orange-400 text-white' :
                              'bg-green-500 text-white'
                            }`}>
                              {getCreditCardPaymentStatus(wallet.credit_due_date) === 'overdue' ? 'Telat' :
                               getCreditCardPaymentStatus(wallet.credit_due_date) === 'due-soon' ? 'Segera' : 'Aman'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="w-full bg-white/20 rounded-full h-1.5 mt-2">
                      <div 
                        className="bg-white h-1.5 rounded-full" 
                        style={{ width: `${getCreditUsagePercentage(wallet.credit_limit, wallet.credit_outstanding)}%` }}
                      />
                    </div>
                    
                    {(wallet.credit_outstanding || 0) > 0 && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          haptic('light');
                          setPayBillWalletId(wallet.id);
                        }}
                        className="mt-2 w-full py-2 bg-white text-bg-primary rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors"
                      >
                        Bayar Tagihan
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-[28px] font-bold text-white tabular-nums tracking-tight">
                    {formatCurrency(wallet.balance)}
                  </p>
                )}
              </div>
            </motion.div>
          ))}

          {/* Add Wallet Button */}
          <motion.button
            onClick={() => { haptic('light'); setShowAddSheet(true); }}
            className="w-full py-4 rounded-[20px] border-2 border-dashed border-border-medium flex items-center justify-center gap-2 text-text-tertiary hover:text-accent-primary hover:border-accent-primary transition-colors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: wallets.length * 0.1 }}
          >
            <Plus size={20} weight="bold" />
            <span className="text-sm font-medium">Tambah Kantong</span>
          </motion.button>
        </div>
      </div>

      {/* Add Wallet Sheet */}
      <BottomSheet isOpen={showAddSheet} onClose={() => setShowAddSheet(false)} title="Tambah Kantong">
        <div className="p-5 space-y-5">
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Nama Kantong</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Contoh: Bank BRI, OVO, dll"
              className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-text-primary placeholder:text-text-tertiary outline-none text-sm"
              autoFocus
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Tipe</label>
            <div className="flex flex-wrap gap-2">
              {WALLET_TYPES.map((wt) => (
                <button
                  key={wt.id}
                  onClick={() => setNewType(wt.id)}
                  className={`px-3 py-2 rounded-xl text-sm transition-all ${
                    newType === wt.id
                      ? 'bg-accent-secondary text-white'
                      : 'bg-bg-secondary text-text-secondary'
                  }`}
                >
                  {wt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Warna</label>
            <div className="flex gap-2.5">
              {WALLET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewColor(color)}
                  className={`w-9 h-9 rounded-full transition-transform ${
                    newColor === color ? 'scale-125 ring-2 ring-offset-2 ring-offset-bg-elevated' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Ikon</label>
            <div className="flex gap-2.5">
              {WALLET_ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setNewIcon(icon)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    newIcon === icon
                      ? 'bg-accent-secondary/15 ring-2 ring-accent-secondary'
                      : 'bg-bg-secondary'
                  }`}
                >
                  <DynamicIcon
                    name={icon}
                    size={20}
                    weight="duotone"
                    className={newIcon === icon ? 'text-accent-secondary' : 'text-text-tertiary'}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Balance / CC Fields */}
          {newType !== 'credit_card' ? (
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">
                Saldo Awal
              </label>
              <input
                type="text"
                value={newBalance}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^-0-9]/g, '').replace(/(?!^)-/g, '');
                  setNewBalance(val);
                }}
                placeholder="0"
                className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-text-primary placeholder:text-text-tertiary outline-none text-sm tabular-nums"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1.5 block">Limit Kartu</label>
                <input
                  type="text"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-text-primary outline-none text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1.5 block">Tagihan Berjalan (Manual Outstanding)</label>
                <input
                  type="text"
                  value={creditOutstanding}
                  onChange={(e) => setCreditOutstanding(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-text-primary outline-none text-sm tabular-nums"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">Periode/Nama Tagihan</label>
                  <input
                    type="text"
                    value={creditStatementLabel}
                    onChange={(e) => setCreditStatementLabel(e.target.value)}
                    placeholder="Contoh: Tagihan Juli"
                    className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-text-primary outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">Jatuh Tempo</label>
                  <input
                    type="date"
                    value={creditDueDate}
                    onChange={(e) => setCreditDueDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-text-primary outline-none text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-bg-secondary">
                <div>
                  <p className="text-sm font-semibold text-text-primary">Otomatis Ulang (Auto Reset)</p>
                  <p className="text-xs text-text-tertiary mt-0.5">Jatuh tempo otomatis maju tiap bulan, limit kembali setelah dibayar.</p>
                </div>
                <button
                  onClick={() => { haptic('light'); setCreditAutoReset(!creditAutoReset); }}
                  className={`relative w-12 h-6 rounded-full transition-colors ${creditAutoReset ? 'bg-accent-primary' : 'bg-border-light'}`}
                >
                  <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${creditAutoReset ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleAddWallet}
            className="w-full py-4 rounded-2xl bg-accent-primary text-white font-semibold text-base active:scale-[0.98] transition-transform shadow-[0_4px_20px_rgba(34,197,94,0.3)]"
          >
            Tambah Kantong ✨
          </button>
        </div>
      </BottomSheet>

      {/* Pay Bill Sheet */}
      <BottomSheet isOpen={payBillWalletId !== null} onClose={() => setPayBillWalletId(null)} title="Bayar Tagihan Kartu Kredit">
        <div className="p-5 space-y-5">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Dari Kantong</label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {wallets.filter(w => w.type !== 'credit_card' && w.id !== payBillWalletId).map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => { haptic('light'); setPaySourceWalletId(wallet.id); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap text-sm transition-all flex-shrink-0 ${
                    paySourceWalletId === wallet.id
                      ? 'bg-accent-secondary text-white shadow-md'
                      : 'bg-bg-secondary text-text-secondary'
                  }`}
                >
                  <DynamicIcon name={wallet.icon} size={16} weight="duotone" />
                  {wallet.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Jumlah Dibayar</label>
            <input
              type="text"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-text-primary outline-none text-sm tabular-nums"
            />
            {payBillWalletId && wallets.find(w => w.id === payBillWalletId)?.credit_outstanding ? (
              <p className="text-xs text-text-tertiary mt-1">
                Tagihan berjalan: {formatCurrency(wallets.find(w => w.id === payBillWalletId)?.credit_outstanding || 0)}
              </p>
            ) : null}
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">Tanggal</label>
              <input
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-text-primary outline-none text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Catatan (Opsional)</label>
            <input
              type="text"
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
              placeholder="Bayar tagihan kartu kredit..."
              className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-text-primary outline-none text-sm"
            />
          </div>
          <button
            onClick={handlePayBill}
            className="w-full py-4 rounded-2xl bg-accent-primary text-white font-semibold text-base active:scale-[0.98] transition-transform shadow-[0_4px_20px_rgba(34,197,94,0.3)]"
          >
            Bayar Tagihan
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}

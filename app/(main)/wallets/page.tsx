// ============================================
// Pundi — Wallets Page
// ============================================

"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, PencilSimple, Trash } from '@phosphor-icons/react';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { formatCurrency } from '@/lib/utils/currency';
import { haptic } from '@/lib/utils/haptic';
import type { WalletType } from '@/lib/types';

const WALLET_COLORS = ['#22C55E', '#3B82F6', '#00AED6', '#8B5CF6', '#EC4899', '#F97316', '#EF4444', '#10B981'];
const WALLET_ICONS = ['Money', 'Bank', 'DeviceMobile', 'CreditCard', 'Wallet', 'PiggyBank', 'ShieldCheck', 'Coin'];
const WALLET_TYPES: { id: WalletType; label: string }[] = [
  { id: 'cash', label: 'Cash' },
  { id: 'bank', label: 'Bank' },
  { id: 'ewallet', label: 'E-Wallet' },
  { id: 'emergency', label: 'Dana Darurat' },
  { id: 'investment', label: 'Investasi' },
  { id: 'other', label: 'Lainnya' },
];

export default function WalletsPage() {
  const { wallets, addWallet, deleteWallet, getTotalBalance } = useWalletStore();
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<WalletType>('cash');
  const [newColor, setNewColor] = useState(WALLET_COLORS[0]);
  const [newIcon, setNewIcon] = useState(WALLET_ICONS[0]);
  const [newBalance, setNewBalance] = useState('0');

  const handleAddWallet = () => {
    if (!newName.trim()) {
      haptic('error');
      return;
    }
    haptic('success');
    addWallet({
      name: newName,
      type: newType,
      balance: parseInt(newBalance, 10) || 0,
      color: newColor,
      icon: newIcon,
    });
    // Reset
    setNewName('');
    setNewBalance('0');
    setShowAddSheet(false);
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

              <div className="relative z-10">
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
                    onClick={() => {
                      haptic('medium');
                      if (confirm(`Hapus kantong "${wallet.name}"?`)) {
                        deleteWallet(wallet.id);
                      }
                    }}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                  >
                    <Trash size={14} weight="bold" className="text-white/70" />
                  </button>
                </div>

                <p className="text-[28px] font-bold text-white tabular-nums tracking-tight">
                  {formatCurrency(wallet.balance)}
                </p>
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

          {/* Balance */}
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Saldo Awal</label>
            <input
              type="number"
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-text-primary placeholder:text-text-tertiary outline-none text-sm tabular-nums"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleAddWallet}
            className="w-full py-4 rounded-2xl bg-accent-primary text-white font-semibold text-base active:scale-[0.98] transition-transform shadow-[0_4px_20px_rgba(34,197,94,0.3)]"
          >
            Tambah Kantong ✨
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}

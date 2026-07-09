// ============================================
// Pundi — Profile & Achievement Page
// ============================================

"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Moon, Sun, SignOut, Trash, Info, Sparkle, User } from '@phosphor-icons/react';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { useGamificationStore } from '@/lib/stores/gamification-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { useDebtStore } from '@/lib/stores/debt-store';
import { useReceivableStore } from '@/lib/stores/receivable-store';
import { getLevelProgress, getLevelTitle } from '@/lib/gamification/xp';
import { getStreakColor, getStreakMessage } from '@/lib/gamification/streak';
import { BADGES } from '@/lib/gamification/badges';
import { haptic } from '@/lib/utils/haptic';
import { supabase } from '@/lib/supabase/client';

export default function ProfilePage() {
  const { progress } = useGamificationStore();
  const { transactions } = useTransactionStore();
  const { wallets } = useWalletStore();

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleSignOut = async () => {
    haptic('medium');
    await supabase.auth.signOut();
    setUser(null);
    window.location.reload();
  };

  const levelProgress = getLevelProgress(progress.xp);
  const streakColor = getStreakColor(progress.streak_days);

  const handleGenerateDummyData = () => {
    haptic('success');
    
    // 1. Wallets
    const walletStore = useWalletStore.getState();
    walletStore.updateWallet('wallet-cash', { balance: 450000 });
    walletStore.updateWallet('wallet-bca', { balance: 11250000 });
    walletStore.updateWallet('wallet-gopay', { balance: 840000 });

    // 2. Transactions
    const txStore = useTransactionStore.getState();
    useTransactionStore.setState({ transactions: [] });

    const cats = txStore.categories;
    const findCatId = (name: string) => cats.find((c) => c.name === name)?.id || cats[0].id;

    const makanId = findCatId('Makan & Minum');
    const transportId = findCatId('Transport');
    const belanjaId = findCatId('Belanja');
    const hiburanId = findCatId('Hiburan');
    const tagihanId = findCatId('Tagihan');
    const kesehatanId = findCatId('Kesehatan');
    const pendidikanId = findCatId('Pendidikan');
    const kopiId = findCatId('Kopi');
    const groceriesId = findCatId('Groceries');
    const langgananId = findCatId('Langganan');
    const gajiId = findCatId('Gaji');
    const freelanceId = findCatId('Freelance');

    const getDateOffset = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() - days);
      return d.toISOString();
    };

    const dummyTxs = [
      { type: 'income' as const, amount: 15000000, category_id: gajiId, wallet_id: 'wallet-bca', date: getDateOffset(3), note: 'Gaji Bulanan' },
      { type: 'income' as const, amount: 2500000, category_id: freelanceId, wallet_id: 'wallet-bca', date: getDateOffset(10), note: 'Proyek Web landing page' },
      { type: 'expense' as const, amount: 2000000, category_id: tagihanId, wallet_id: 'wallet-bca', date: getDateOffset(2), note: 'Bayar Kost Bulanan' },
      { type: 'expense' as const, amount: 850000, category_id: groceriesId, wallet_id: 'wallet-bca', date: getDateOffset(5), note: 'Belanja bulanan Superindo' },
      { type: 'expense' as const, amount: 450000, category_id: tagihanId, wallet_id: 'wallet-bca', date: getDateOffset(4), note: 'Listrik & Air' },
      { type: 'expense' as const, amount: 186000, category_id: langgananId, wallet_id: 'wallet-bca', date: getDateOffset(11), note: 'Netflix Family' },
      { type: 'expense' as const, amount: 95000, category_id: pendidikanId, wallet_id: 'wallet-bca', date: getDateOffset(14), note: 'Buku Finansial Psychology of Money' },
      
      { type: 'expense' as const, amount: 45000, category_id: makanId, wallet_id: 'wallet-gopay', date: getDateOffset(0), note: 'Makan siang Geprek' },
      { type: 'expense' as const, amount: 22000, category_id: transportId, wallet_id: 'wallet-gopay', date: getDateOffset(0), note: 'GoJek ke Kantor' },
      { type: 'expense' as const, amount: 120000, category_id: hiburanId, wallet_id: 'wallet-gopay', date: getDateOffset(3), note: 'Tiket Bioskop XXI' },
      { type: 'expense' as const, amount: 15000, category_id: belanjaId, wallet_id: 'wallet-gopay', date: getDateOffset(6), note: 'Kaos Polos Uniqlo' },
      { type: 'expense' as const, amount: 45000, category_id: kesehatanId, wallet_id: 'wallet-gopay', date: getDateOffset(9), note: 'Beli obat flu Panadol' },
      { type: 'expense' as const, amount: 210000, category_id: makanId, wallet_id: 'wallet-gopay', date: getDateOffset(12), note: 'Makan Seafood bareng squad' },
      { type: 'expense' as const, amount: 40000, category_id: kopiId, wallet_id: 'wallet-gopay', date: getDateOffset(0), note: 'Kopi Kenangan Flash' },
      
      { type: 'expense' as const, amount: 35000, category_id: kopiId, wallet_id: 'wallet-cash', date: getDateOffset(1), note: 'Kopi Susu Tuku' },
      { type: 'expense' as const, amount: 65000, category_id: makanId, wallet_id: 'wallet-cash', date: getDateOffset(1), note: 'Bebek Goreng H. Slamet' },
      { type: 'expense' as const, amount: 250000, category_id: transportId, wallet_id: 'wallet-cash', date: getDateOffset(8), note: 'Service & Oli Motor' },
      { type: 'expense' as const, amount: 50000, category_id: transportId, wallet_id: 'wallet-cash', date: getDateOffset(13), note: 'Bensin Shell' },
      { type: 'expense' as const, amount: 15000, category_id: makanId, wallet_id: 'wallet-cash', date: getDateOffset(0), note: 'Bubur Ayam Pagi' },
    ];

    dummyTxs.forEach((tx) => {
      txStore.addTransaction(tx);
    });

    // 3. Debts
    const debtStore = useDebtStore.getState();
    useDebtStore.setState({ debts: [], payments: [] });
    debtStore.addDebt({
      creditor: 'Tokopedia Card (Cicilan HP)',
      total_amount: 6000000,
      remaining_amount: 2500000,
      due_date: getDateOffset(-10).split('T')[0],
      status: 'active',
      note: 'Cicilan HP iPhone 13',
    });
    debtStore.addDebt({
      creditor: 'Kakak (Modal Usaha)',
      total_amount: 2000000,
      remaining_amount: 1000000,
      status: 'active',
      note: 'Pinjam tanpa bunga',
    });

    // 4. Receivables
    const recStore = useReceivableStore.getState();
    useReceivableStore.setState({ receivables: [], payments: [] });
    recStore.addReceivable({
      debtor: 'Budi (Split Bill)',
      total_amount: 120000,
      remaining_amount: 120000,
      status: 'unpaid',
      note: 'Makan Seafood bareng squad',
    });
    recStore.addReceivable({
      debtor: 'Adik (Bensin)',
      total_amount: 50000,
      remaining_amount: 50000,
      status: 'unpaid',
    });

    // 5. Gamification
    const gamificationStore = useGamificationStore.getState();
    gamificationStore.recordActivity();
    useGamificationStore.setState({
      progress: {
        id: 'local-progress',
        user_id: 'local-user',
        xp: 450,
        level: 3,
        streak_days: 8,
        last_activity_date: getDateOffset(0).split('T')[0],
        badges: ['first-transaction', 'streak-7', 'multi-wallet'],
        created_at: getDateOffset(15),
        updated_at: getDateOffset(0),
      }
    });

    alert('Berhasil membuat dummy data! Silakan cek Dashboard, Transaksi, Hutang/Split, dan chat AI Advisor 🐷🚀');
    window.location.reload();
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
            Profil
          </motion.h1>
        </div>
      </div>

      <div className="px-5 pb-8 space-y-5">
        {/* Avatar & XP Ring */}
        <motion.div
          className="flex flex-col items-center py-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <ProgressRing
            percentage={levelProgress.percentage}
            size={120}
            strokeWidth={8}
            color="var(--gamify-gold)"
          >
            <span className="text-5xl">🐷</span>
          </ProgressRing>
          <h2 className="text-xl font-bold text-text-primary mt-4">Rangga</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-3 py-1 rounded-full bg-gamify-gold/15 text-gamify-gold text-sm font-bold">
              Level {progress.level}
            </span>
            <span className="text-sm text-text-secondary">
              {getLevelTitle(progress.level)}
            </span>
          </div>
          <p className="text-xs text-text-tertiary mt-2 tabular-nums">
            {levelProgress.current} / {levelProgress.required} XP ke level berikutnya
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-3 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-bg-elevated rounded-[14px] p-4 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <p className="text-2xl font-bold tabular-nums" style={{ color: streakColor }}>
              {progress.streak_days}
            </p>
            <p className="text-[11px] text-text-tertiary mt-1">Hari Streak</p>
          </div>
          <div className="bg-bg-elevated rounded-[14px] p-4 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <p className="text-2xl font-bold text-accent-secondary tabular-nums">
              {transactions.length}
            </p>
            <p className="text-[11px] text-text-tertiary mt-1">Transaksi</p>
          </div>
          <div className="bg-bg-elevated rounded-[14px] p-4 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <p className="text-2xl font-bold text-accent-primary tabular-nums">
              {progress.badges.length}
            </p>
            <p className="text-[11px] text-text-tertiary mt-1">Badge</p>
          </div>
        </motion.div>

        {/* Streak Message */}
        <motion.div
          className="rounded-[14px] p-4 text-center"
          style={{ backgroundColor: streakColor + '15' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <p className="text-sm font-semibold" style={{ color: streakColor }}>
            {getStreakMessage(progress.streak_days)}
          </p>
        </motion.div>

        {/* Badge Shelf */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-[15px] font-semibold text-text-primary mb-3">
            Koleksi Badge ({progress.badges.length}/{BADGES.length})
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {BADGES.map((badge) => {
              const unlocked = progress.badges.includes(badge.id);
              return (
                <motion.div
                  key={badge.id}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-[14px] ${
                    unlocked
                      ? 'bg-bg-elevated shadow-[0_2px_12px_rgba(0,0,0,0.06)]'
                      : 'bg-bg-secondary/50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      unlocked ? '' : 'opacity-20 grayscale'
                    }`}
                    style={{ backgroundColor: unlocked ? 'var(--gamify-gold)' + '20' : 'transparent' }}
                  >
                    <DynamicIcon
                      name={badge.icon}
                      size={22}
                      weight={unlocked ? 'duotone' : 'regular'}
                      className={unlocked ? 'text-gamify-gold' : 'text-text-tertiary'}
                    />
                  </div>
                  <span className={`text-[10px] text-center leading-tight ${
                    unlocked ? 'text-text-primary font-medium' : 'text-text-tertiary'
                  }`}>
                    {badge.name}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Settings section */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-[15px] font-semibold text-text-primary mb-2">Pengaturan</h3>

          <button
            onClick={handleGenerateDummyData}
            className="w-full flex items-center gap-3 p-4 rounded-[14px] bg-bg-elevated shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-accent-primary/20 bg-accent-primary/5 active:scale-[0.98] transition-transform"
          >
            <Sparkle size={20} weight="duotone" className="text-accent-primary animate-pulse" />
            <span className="text-sm text-text-primary font-semibold flex-1 text-left">Buat Dummy Data AI</span>
          </button>

          {user ? (
            <div className="w-full flex items-center gap-3 p-4 rounded-[14px] bg-bg-elevated shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-accent-secondary/20">
              <User size={20} weight="duotone" className="text-accent-secondary" />
              <div className="flex-1 text-left min-w-0">
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">Tersinkronisasi</p>
                <p className="text-sm font-bold text-text-primary truncate">{user.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded-lg bg-accent-danger/10 text-accent-danger text-xs font-semibold active:scale-95"
              >
                Keluar
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => haptic('light')}
              className="w-full flex items-center gap-3 p-4 rounded-[14px] bg-bg-elevated shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-accent-secondary/20 active:scale-[0.98] transition-transform"
            >
              <User size={20} weight="duotone" className="text-accent-secondary" />
              <span className="text-sm text-text-primary font-semibold flex-1 text-left">Masuk Akun & Sync ☁️</span>
            </Link>
          )}

          <button
            onClick={() => {
              haptic('light');
              document.documentElement.classList.toggle('dark');
            }}
            className="w-full flex items-center gap-3 p-4 rounded-[14px] bg-bg-elevated shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
          >
            <Moon size={20} weight="duotone" className="text-accent-secondary" />
            <span className="text-sm text-text-primary flex-1 text-left">Mode Gelap</span>
          </button>

          <button
            onClick={() => {
              haptic('medium');
              if (confirm('Reset semua data? Tindakan ini tidak bisa dibatalkan.')) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="w-full flex items-center gap-3 p-4 rounded-[14px] bg-bg-elevated shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
          >
            <Trash size={20} weight="duotone" className="text-accent-danger" />
            <span className="text-sm text-text-primary flex-1 text-left">Reset Semua Data</span>
          </button>

          <div className="w-full flex items-center gap-3 p-4 rounded-[14px] bg-bg-elevated shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <Info size={20} weight="duotone" className="text-text-tertiary" />
            <span className="text-sm text-text-secondary flex-1 text-left">Pundi v0.1.0 — MVP</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

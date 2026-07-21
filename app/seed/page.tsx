"use client";

import React, { useState } from 'react';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { useBudgetStore } from '@/lib/stores/budget-store';

export default function SeedPage() {
  const [status, setStatus] = useState<string>('Ready to seed.');

  const handleSeed = () => {
    try {
      setStatus('Seeding...');

      const { addWallet, wallets, deleteWallet } = useWalletStore.getState();
      const { addTransaction, transactions, deleteTransaction } = useTransactionStore.getState();
      const { setCategoryBudget, clearBudgets } = useBudgetStore.getState();

      // Clear existing data (optional, but good for clean slate)
      wallets.forEach(w => deleteWallet(w.id));
      transactions.forEach(t => deleteTransaction(t.id));
      clearBudgets();

      // 1. Wallets
      const walletCash = addWallet({
        name: 'Cash',
        type: 'cash',
        balance: 450000,
        color: '#10B981',
        icon: 'Money',
      });
      const walletBca = addWallet({
        name: 'Bank BCA',
        type: 'bank',
        balance: 11300000,
        color: '#3B82F6',
        icon: 'Bank',
      });
      const walletGopay = addWallet({
        name: 'GoPay',
        type: 'ewallet',
        balance: 840000,
        color: '#0EA5E9',
        icon: 'DeviceMobile',
      });

      const wCash = walletCash.id;
      const wBca = walletBca.id;
      const wGopay = walletGopay.id;

      // 2. Transactions
      const now = new Date();
      const createDate = (daysAgo: number) => {
        const d = new Date(now);
        d.setDate(d.getDate() - daysAgo);
        return d.toISOString();
      };

      const dummyTxs = [
        { type: 'income', amount: 17500000, cat: 'salary', wallet: wBca, note: 'Gaji Bulanan', daysAgo: 5 },
        { type: 'expense', amount: 250000, cat: 'food', wallet: wGopay, note: 'Makan Malam Seafood', daysAgo: 0 },
        { type: 'expense', amount: 35000, cat: 'transport', wallet: wGopay, note: 'GoRide ke Kantor', daysAgo: 0 },
        { type: 'expense', amount: 50000, cat: 'food', wallet: wCash, note: 'Kopi Susu', daysAgo: 1 },
        { type: 'expense', amount: 120000, cat: 'entertainment', wallet: wBca, note: 'Nonton Bioskop', daysAgo: 2 },
        { type: 'expense', amount: 1500000, cat: 'shopping', wallet: wBca, note: 'Beli Sepatu Baru', daysAgo: 3 },
        { type: 'expense', amount: 450000, cat: 'bills', wallet: wBca, note: 'Listrik & Air', daysAgo: 4 },
        { type: 'expense', amount: 75000, cat: 'transport', wallet: wGopay, note: 'Taksi Online', daysAgo: 4 },
        { type: 'expense', amount: 125000, cat: 'food', wallet: wGopay, note: 'Makan Siang Bareng Teman', daysAgo: 5 },
      ];

      dummyTxs.forEach((tx) => {
        addTransaction({
          wallet_id: tx.wallet,
          category_id: tx.cat,
          type: tx.type as 'income' | 'expense' | 'transfer',
          amount: tx.amount,
          date: createDate(tx.daysAgo),
          note: tx.note,
        });
      });

      // 3. Budgets
      setCategoryBudget('food', 2000000);
      setCategoryBudget('transport', 500000);

      setStatus('Seeding complete! You can now go to /dashboard.');
    } catch (e: unknown) {
      console.error(e);
      setStatus('Error: ' + (e as Error).message);
    }
  };

  return (
    <div className="p-10 font-sans bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-black">Database Seeder</h1>
      <p className="mb-4 text-gray-600">This will clear existing wallets/transactions/budgets and insert a dummy dataset for testing AI features.</p>
      <button 
        onClick={handleSeed}
        className="px-4 py-2 bg-accent-secondary text-text-on-accent rounded hover:bg-accent-secondary-hover active:scale-95 transition-all"
      >
        Inject Dummy Data
      </button>
      <p className="mt-4 font-mono text-sm text-gray-800">{status}</p>
    </div>
  );
}

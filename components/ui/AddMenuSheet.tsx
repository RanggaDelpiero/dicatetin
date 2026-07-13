// ============================================
// Pundi — Add Menu Hub
// ============================================

"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { BottomSheet } from './BottomSheet';
import { haptic } from '@/lib/utils/haptic';
import { Receipt, Swap, UsersThree } from '@phosphor-icons/react';

interface AddMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTransaction: () => void;
}

export function AddMenuSheet({ isOpen, onClose, onOpenTransaction }: AddMenuSheetProps) {
  const router = useRouter();

  const handleOptionClick = (action: () => void) => {
    haptic('medium');
    onClose();
    // Wait for the sheet to close slightly before executing action
    setTimeout(() => {
      action();
    }, 150);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Tambah Catatan 📝">
      <div className="p-5 pb-safe space-y-3">
        {/* Regular Transaction */}
        <button
          onClick={() => handleOptionClick(onOpenTransaction)}
          className="w-full flex items-center gap-4 p-4 rounded-2xl bg-bg-secondary active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 rounded-xl bg-accent-primary/20 text-accent-primary flex items-center justify-center">
            <Swap size={24} weight="duotone" />
          </div>
          <div className="text-left flex-1">
            <h3 className="text-base font-bold text-text-primary">Transaksi Baru</h3>
            <p className="text-xs text-text-secondary mt-0.5">Pengeluaran, pemasukan, atau transfer</p>
          </div>
        </button>

        {/* Debt / Receivables */}
        <button
          onClick={() => handleOptionClick(() => router.push('/debts#add-debt'))}
          className="w-full flex items-center gap-4 p-4 rounded-2xl bg-bg-secondary active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 rounded-xl bg-accent-secondary/20 text-accent-secondary flex items-center justify-center">
            <UsersThree size={24} weight="duotone" />
          </div>
          <div className="text-left flex-1">
            <h3 className="text-base font-bold text-text-primary">Catat Hutang/Piutang</h3>
            <p className="text-xs text-text-secondary mt-0.5">Catat pinjaman atau uang yang dipinjam</p>
          </div>
        </button>

        {/* Split Bill */}
        <button
          onClick={() => handleOptionClick(() => router.push('/debts#add-split'))}
          className="w-full flex items-center gap-4 p-4 rounded-2xl bg-bg-secondary active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 rounded-xl bg-accent-tertiary/20 text-accent-tertiary flex items-center justify-center">
            <Receipt size={24} weight="duotone" />
          </div>
          <div className="text-left flex-1">
            <h3 className="text-base font-bold text-text-primary">Buat Split Bill</h3>
            <p className="text-xs text-text-secondary mt-0.5">Bagi tagihan makan atau patungan</p>
          </div>
        </button>
      </div>
    </BottomSheet>
  );
}

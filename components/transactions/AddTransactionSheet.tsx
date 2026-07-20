// ============================================
// Pundi — Add Transaction Bottom Sheet
// ============================================

"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Backspace, CalendarBlank, Notebook, ArrowUp, ArrowDown, Sparkle, SpinnerGap } from '@phosphor-icons/react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { useGamificationStore } from '@/lib/stores/gamification-store';
import { formatCurrency } from '@/lib/utils/currency';
import { getToday } from '@/lib/utils/date';
import { haptic } from '@/lib/utils/haptic';
import { XP_REWARDS } from '@/lib/gamification/xp';
import { compressImage } from '@/lib/utils/image';
import { getAvailableCredit } from '@/lib/finance/credit-card';
import type { TransactionType, WalletType } from '@/lib/types';

function getWalletTransactionDelta(walletType: WalletType | undefined, txType: TransactionType, amount: number) {
  if (walletType === 'credit_card') {
    if (txType === 'expense') return { cashDelta: 0, creditOutstandingDelta: amount };
    if (txType === 'income') return { cashDelta: 0, creditOutstandingDelta: -amount };
  }
  return { cashDelta: txType === 'income' ? amount : -amount, creditOutstandingDelta: 0 };
}

interface AddTransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  editTransactionId?: string;
}

export function AddTransactionSheet({ isOpen, onClose, editTransactionId }: AddTransactionSheetProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('0');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getToday());
  const [showNote, setShowNote] = useState(false);
  const [isAiExtracting, setIsAiExtracting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);

  const handleAiCategorize = async () => {
    if (!note.trim()) {
      alert('Tulis catatan transaksi dulu ya sebelum minta tolong AI.');
      return;
    }
    
    haptic('medium');
    setIsCategorizing(true);
    
    try {
      const res = await fetch('/api/ai/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note,
          type,
          categories: filteredCategories.map(c => ({ id: c.id, name: c.name }))
        })
      });
      
      if (!res.ok) throw new Error('Gagal menghubungi AI.');
      
      const data = await res.json();
      if (data.categoryId) {
        setSelectedCategoryId(data.categoryId);
        haptic('success');
      } else if (data.alternativeCategoryId) {
        setSelectedCategoryId(data.alternativeCategoryId);
        haptic('success');
      }
    } catch (err) {
      console.error(err);
      haptic('error');
    } finally {
      setIsCategorizing(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    haptic('medium');
    setIsAiExtracting(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const rawBase64 = reader.result as string;
        const compressedBase64 = await compressImage(rawBase64);
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'photo',
            image: compressedBase64,
            mode: 'transaction',
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Gagal mengekstrak data.');
        }

        const result = await res.json();
        const extractedAmount = result.amount || result.total_amount;
        if (extractedAmount) {
          haptic('success');
          setAmount(extractedAmount.toString());
          if (result.type) setType(result.type);
          if (result.date) setDate(result.date);
          if (result.note) {
            setNote(result.note);
            setShowNote(true);
          }
          if (result.category) {
            const cat = categories.find(
              (c) => c.name.toLowerCase().trim() === result.category.toLowerCase().trim()
            );
            if (cat) setSelectedCategoryId(cat.id);
          }
        }
      } catch (err: unknown) {
        const error = err as Error;
        console.error(error);
        haptic('error');
        alert(error.message || 'Gagal mengekstrak bill dari foto.');
      } finally {
        setIsAiExtracting(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVoiceRecord = () => {
    haptic('medium');
    const SpeechRecognition =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Pencatatan suara tidak didukung oleh browser Anda. Gunakan Chrome atau Safari.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsRecording(false);
      setIsAiExtracting(true);

      try {
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'voice',
            text: transcript,
            mode: 'transaction',
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Gagal mengekstrak ucapan.');
        }

        const result = await res.json();
        const extractedAmount = result.amount || result.total_amount;
        if (extractedAmount) {
          haptic('success');
          setAmount(extractedAmount.toString());
          if (result.type) setType(result.type);
          if (result.date) setDate(result.date);
          if (result.note) {
            setNote(result.note);
            setShowNote(true);
          }
          if (result.category) {
            const cat = categories.find(
              (c) => c.name.toLowerCase().trim() === result.category.toLowerCase().trim()
            );
            if (cat) setSelectedCategoryId(cat.id);
          }
        }
      } catch (err: unknown) {
        const error = err as Error;
        console.error(error);
        haptic('error');
        alert(error.message || 'AI gagal memahami catatan suaramu.');
      } finally {
        setIsAiExtracting(false);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error(event);
      setIsRecording(false);
      haptic('error');
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const { addTransaction, updateTransaction, transactions, categories } = useTransactionStore();
  const { wallets, updateBalance, updateWallet } = useWalletStore();
  const { addXP, recordActivity } = useGamificationStore();

  // Load existing transaction if editing
  React.useEffect(() => {
    if (isOpen && editTransactionId) {
      const existingTx = transactions.find(t => t.id === editTransactionId);
      if (existingTx) {
        // Schedule state updates to prevent "synchronous setState in effect" lint error when rendered from layout
        const timer = setTimeout(() => {
          setType(existingTx.type);
          setAmount(existingTx.amount.toString());
          setSelectedCategoryId(existingTx.category_id);
          setSelectedWalletId(existingTx.wallet_id);
          setDate(existingTx.date.split('T')[0]);
          if (existingTx.note) {
            setNote(existingTx.note);
            setShowNote(true);
          }
        }, 50);
        return () => clearTimeout(timer);
      }
    } else if (isOpen && !editTransactionId) {
      // Reset form on open
      const timer = setTimeout(() => {
        setType('expense');
        setAmount('0');
        setNote('');
        setDate(getToday());
        setShowNote(false);
        setSelectedCategoryId('');
        setSelectedWalletId('');
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, editTransactionId, transactions]);

  const filteredCategories = categories.filter((c) => c.type === type);

  // Auto-select first category
  React.useEffect(() => {
    if (filteredCategories.length > 0 && !selectedCategoryId && !editTransactionId) {
      const timer = setTimeout(() => setSelectedCategoryId(filteredCategories[0].id), 50);
      return () => clearTimeout(timer);
    }
  }, [filteredCategories, selectedCategoryId, editTransactionId]);

  // Auto-select first wallet
  React.useEffect(() => {
    if (wallets.length > 0 && !selectedWalletId && !editTransactionId) {
      const timer = setTimeout(() => setSelectedWalletId(wallets[0].id), 50);
      return () => clearTimeout(timer);
    }
  }, [wallets, selectedWalletId, editTransactionId]);

  const handleKeyPress = (key: string) => {
    haptic('light');
    if (key === 'backspace') {
      setAmount((prev) => (prev.length <= 1 ? '0' : prev.slice(0, -1)));
    } else if (key === '000') {
      if (amount !== '0') setAmount((prev) => prev + '000');
    } else {
      if (amount === '0') {
        setAmount(key);
      } else if (amount.length < 12) {
        setAmount((prev) => prev + key);
      }
    }
  };

  const handleSubmit = () => {
    const numAmount = parseInt(amount, 10);
    if (numAmount <= 0 || !selectedCategoryId || !selectedWalletId) {
      haptic('error');
      return;
    }

    haptic('success');

    if (editTransactionId) {
      const existingTx = transactions.find(t => t.id === editTransactionId);
      if (existingTx) {
        const existingWallet = wallets.find(w => w.id === existingTx.wallet_id);
        const newWallet = wallets.find(w => w.id === selectedWalletId);

        // Reverse previous balance effect
        const oldDelta = getWalletTransactionDelta(existingWallet?.type, existingTx.type, existingTx.amount);
        if (oldDelta.cashDelta !== 0) {
          updateBalance(existingTx.wallet_id, -oldDelta.cashDelta);
        }
        if (oldDelta.creditOutstandingDelta !== 0 && existingWallet) {
          updateWallet(existingTx.wallet_id, {
            credit_outstanding: Math.max(0, (existingWallet.credit_outstanding || 0) - oldDelta.creditOutstandingDelta)
          });
        }

        // Update transaction
        updateTransaction(editTransactionId, {
          type,
          amount: numAmount,
          category_id: selectedCategoryId,
          wallet_id: selectedWalletId,
          date,
          note: note || undefined,
        });

        // Apply new balance effect
        const newDelta = getWalletTransactionDelta(newWallet?.type, type, numAmount);
        if (newDelta.cashDelta !== 0) {
          updateBalance(selectedWalletId, newDelta.cashDelta);
        }
        if (newDelta.creditOutstandingDelta !== 0 && newWallet) {
          updateWallet(selectedWalletId, {
            credit_outstanding: (newWallet.credit_outstanding || 0) + newDelta.creditOutstandingDelta
          });
        }
      }
    } else {
      // Add transaction
      addTransaction({
        type,
        amount: numAmount,
        category_id: selectedCategoryId,
        wallet_id: selectedWalletId,
        date,
        note: note || undefined,
      });

      const newWallet = wallets.find(w => w.id === selectedWalletId);
      const newDelta = getWalletTransactionDelta(newWallet?.type, type, numAmount);

      // Update wallet balance
      if (newDelta.cashDelta !== 0) {
        updateBalance(selectedWalletId, newDelta.cashDelta);
      }
      if (newDelta.creditOutstandingDelta !== 0 && newWallet) {
        updateWallet(selectedWalletId, {
          credit_outstanding: (newWallet.credit_outstanding || 0) + newDelta.creditOutstandingDelta
        });
      }

      // Gamification
      addXP(XP_REWARDS.ADD_TRANSACTION);
      recordActivity();
    }

    // Reset form
    setAmount('0');
    setNote('');
    setShowNote(false);
    onClose();
  };

  const handleTypeToggle = (newType: TransactionType) => {
    haptic('light');
    setType(newType);
    setSelectedCategoryId('');
  };

  const numericAmount = parseInt(amount, 10);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} fullHeight>
      <div className="flex flex-col h-full px-5 pt-2 pb-safe">
        {/* Header Title (optional visual hint for edit mode) */}
        {editTransactionId && (
          <div className="mb-2 text-center text-sm font-semibold text-text-secondary">
            Mengedit Transaksi
          </div>
        )}

        {/* Type Toggle */}
        <div className="flex gap-2 p-1 rounded-xl bg-bg-secondary mb-4">
          <button
            onClick={() => handleTypeToggle('expense')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              type === 'expense'
                ? 'bg-accent-danger text-white shadow-md'
                : 'text-text-secondary'
            }`}
          >
            <ArrowDown size={16} weight="bold" />
            Pengeluaran
          </button>
          <button
            onClick={() => handleTypeToggle('income')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              type === 'income'
                ? 'bg-accent-primary text-white shadow-md'
                : 'text-text-secondary'
            }`}
          >
            <ArrowUp size={16} weight="bold" />
            Pemasukan
          </button>
        </div>

        {/* Amount Display */}
        <div className="text-center mb-4">
          <motion.div
            key={amount}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            className={`text-[34px] font-bold tabular-nums ${
              type === 'income' ? 'text-accent-primary' : 'text-text-primary'
            }`}
          >
            {formatCurrency(numericAmount)}
          </motion.div>
        </div>

        {/* Wallet Selector */}
        <div className="flex gap-2 mb-2 overflow-x-auto no-scrollbar pb-1">
          {wallets.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => { haptic('light'); setSelectedWalletId(wallet.id); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap text-sm transition-all flex-shrink-0 ${
                selectedWalletId === wallet.id
                  ? 'bg-accent-secondary text-white shadow-md'
                  : 'bg-bg-secondary text-text-secondary'
              }`}
            >
              <DynamicIcon name={wallet.icon} size={16} weight="duotone" />
              {wallet.type === 'credit_card'
                ? `${wallet.name} · sisa limit ${formatCurrency(getAvailableCredit(wallet.credit_limit, wallet.credit_outstanding))}`
                : wallet.name}
            </button>
          ))}
        </div>

        {/* Credit Card Hint */}
        {wallets.find(w => w.id === selectedWalletId)?.type === 'credit_card' && type === 'expense' && (
          <div className="px-3 py-2 mb-4 rounded-lg bg-accent-secondary/10 text-accent-secondary text-xs">
            💡 Transaksi ini masuk pengeluaran, tapi pembayarannya nanti dicatat saat kamu bayar tagihan.
          </div>
        )}

        {/* Category Grid */}
        <div className="mb-3 overflow-hidden">
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2 px-5 -mx-5">
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { haptic('light'); setSelectedCategoryId(cat.id); }}
                className="flex flex-col items-center gap-1 flex-shrink-0 w-[72px] text-center"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    selectedCategoryId === cat.id
                      ? 'ring-2 ring-accent-secondary ring-offset-2 ring-offset-bg-elevated scale-110'
                      : 'opacity-60'
                  }`}
                  style={{ backgroundColor: cat.color + '20' }}
                >
                  <DynamicIcon name={cat.icon} size={22} weight="duotone" style={{ color: cat.color }} />
                </div>
                <span className={`text-[10px] leading-tight text-center break-all line-clamp-2 w-full ${
                  selectedCategoryId === cat.id ? 'text-text-primary font-medium' : 'text-text-tertiary'
                }`}>
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Note & Date Row */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowNote(!showNote)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm ${
              showNote || note ? 'bg-accent-secondary/10 text-accent-secondary' : 'bg-bg-secondary text-text-tertiary'
            }`}
          >
            <Notebook size={16} weight="duotone" />
            <span className="max-w-[80px] truncate">{note || 'Catatan'}</span>
          </button>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-bg-secondary text-text-tertiary text-sm flex-1">
            <CalendarBlank size={16} weight="duotone" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-text-secondary text-sm outline-none w-full"
            />
          </div>
        </div>

        {/* AI Quick Add Row */}
        <div className="flex gap-2 mb-4 relative">
          {/* Camera Upload */}
          <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-bg-secondary text-text-secondary hover:text-accent-secondary transition-colors cursor-pointer text-xs font-semibold">
            <span>📸 Foto Bill</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={isAiExtracting}
            />
          </label>

          {/* Voice Command */}
          <button
            type="button"
            onClick={handleVoiceRecord}
            disabled={isAiExtracting}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              isRecording
                ? 'bg-accent-danger text-white animate-pulse'
                : 'bg-bg-secondary text-text-secondary'
            }`}
          >
            <span>{isRecording ? '🔊 Mendengarkan...' : '🎤 Ngomong'}</span>
          </button>

          {/* Loading Indicator */}
          {isAiExtracting && (
            <div className="absolute inset-0 bg-bg-elevated/80 flex items-center justify-center gap-2 rounded-xl">
              <span className="w-4 h-4 rounded-full border-2 border-accent-secondary border-t-transparent animate-spin" />
              <span className="text-xs font-semibold text-accent-secondary animate-pulse">DicatetinAja AI sedang membaca...</span>
            </div>
          )}
        </div>

        {/* Note Input */}
        <AnimatePresence>
          {showNote && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="relative">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Tulis catatan (contoh: Kopi Starbucks)"
                  className="w-full pl-4 pr-12 py-3 rounded-xl bg-bg-secondary text-text-primary placeholder:text-text-tertiary outline-none text-sm"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAiCategorize}
                  disabled={isCategorizing || !note.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center bg-accent-secondary/10 text-accent-secondary disabled:opacity-50 transition-all active:scale-95"
                  title="Pilih kategori otomatis dengan AI"
                >
                  {isCategorizing ? <SpinnerGap size={16} className="animate-spin" /> : <Sparkle size={16} weight="fill" />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 mb-4 flex-1 content-end">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'backspace'].map(
            (key) => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className="h-14 rounded-xl bg-bg-secondary text-text-primary text-xl font-medium flex items-center justify-center active:bg-border-medium transition-colors haptic-press"
              >
                {key === 'backspace' ? (
                  <Backspace size={24} weight="regular" />
                ) : (
                  key
                )}
              </button>
            )
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={numericAmount <= 0}
          className={`w-full py-4 rounded-2xl text-white font-semibold text-[17px] transition-all active:scale-[0.98] ${
            numericAmount > 0
              ? type === 'income'
                ? 'bg-accent-primary shadow-[0_4px_20px_rgba(34,197,94,0.3)]'
                : 'bg-accent-danger shadow-[0_4px_20px_rgba(239,68,68,0.3)]'
              : 'bg-text-tertiary/30 cursor-not-allowed'
          }`}
          style={{ marginBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}
        >
          {editTransactionId
            ? '💾 Update Transaksi'
            : (type === 'income' ? '💰 Simpan Pemasukan' : '💸 Simpan Pengeluaran')}
        </button>
      </div>
    </BottomSheet>
  );
}

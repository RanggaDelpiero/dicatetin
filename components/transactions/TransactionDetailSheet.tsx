// ============================================
// Pundi — Transaction Detail Sheet
// ============================================

"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PencilSimple, Trash, Camera, Microphone, PencilLine, Clock, ArrowUp, ArrowDown } from '@phosphor-icons/react';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { Transaction, TransactionSource } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/currency';
import { haptic } from '@/lib/utils/haptic';

const SOURCE_LABELS: Record<TransactionSource, { label: string; icon: React.ReactNode; color: string }> = {
  manual: {
    label: 'Input Manual',
    icon: <PencilLine size={14} weight="duotone" />,
    color: 'text-text-secondary bg-bg-secondary',
  },
  photo: {
    label: 'Foto Struk',
    icon: <Camera size={14} weight="duotone" />,
    color: 'text-accent-secondary bg-accent-secondary/10',
  },
  voice: {
    label: 'Input Suara',
    icon: <Microphone size={14} weight="duotone" />,
    color: 'text-accent-primary bg-accent-primary/10',
  },
};

const FIELD_LABELS: Record<string, string> = {
  amount: 'Jumlah',
  category_id: 'Kategori',
  wallet_id: 'Wallet',
  note: 'Catatan',
  date: 'Tanggal',
  type: 'Tipe',
};

interface TransactionDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  walletName?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TransactionDetailSheet({
  isOpen,
  onClose,
  transaction,
  categoryName,
  categoryIcon,
  categoryColor,
  walletName,
  onEdit,
  onDelete,
}: TransactionDetailSheetProps) {
  const [now] = useState(() => Date.now());

  if (!transaction) return null;

  const source = SOURCE_LABELS[transaction.sourceType || 'manual'];
  const editHistory = transaction.editHistory || [];

  const formatFieldValue = (field: string, value: unknown): string => {
    if (field === 'amount' && typeof value === 'number') return formatCurrency(value);
    if (field === 'date' && typeof value === 'string') {
      return new Date(value).toLocaleDateString('id-ID', { dateStyle: 'medium' });
    }
    return String(value || '-');
  };

  const getRelativeTime = (isoString: string): string => {
    const diff = now - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} mnt lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-bg-elevated rounded-t-[24px] max-h-[80vh] overflow-y-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="p-5 pb-safe">
              <div className="w-10 h-1 rounded-full bg-border-medium mx-auto mb-4" />

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-text-primary">Detail Transaksi</h2>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center">
                  <X size={18} weight="bold" className="text-text-secondary" />
                </button>
              </div>

              {/* Main Info */}
              <div className="flex items-center gap-4 mb-5">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: (categoryColor || '#6B7280') + '20' }}
                >
                  <DynamicIcon
                    name={categoryIcon || 'DotsThree'}
                    size={28}
                    weight="duotone"
                    style={{ color: categoryColor || '#6B7280' }}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-text-primary">{categoryName || 'Lainnya'}</p>
                  <p className="text-xs text-text-tertiary">{walletName || ''}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    {transaction.type === 'income' ? (
                      <ArrowUp size={16} weight="bold" className="text-accent-primary" />
                    ) : (
                      <ArrowDown size={16} weight="bold" className="text-accent-danger" />
                    )}
                    <span className={`text-xl font-bold tabular-nums ${
                      transaction.type === 'income' ? 'text-accent-primary' : 'text-text-primary'
                    }`}>
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Source Badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${source.color}`}>
                  {source.icon} {source.label}
                </span>
                <span className="text-xs text-text-tertiary">
                  {new Date(transaction.date).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>

              {/* Details Grid */}
              <div className="space-y-3 mb-5">
                {transaction.note && (
                  <div className="bg-bg-secondary/50 rounded-xl px-4 py-3">
                    <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold mb-1">Catatan</p>
                    <p className="text-sm text-text-primary">{transaction.note}</p>
                  </div>
                )}

                {transaction.receipt_url && (
                  <div className="bg-bg-secondary/50 rounded-xl px-4 py-3">
                    <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold mb-1">Foto Struk</p>
                    <p className="text-xs text-accent-secondary">📷 Tersimpan</p>
                  </div>
                )}

                {/* AI Extraction Data */}
                {transaction.extractionData && (
                  <div className="bg-accent-secondary/5 rounded-xl px-4 py-3 border border-accent-secondary/10">
                    <p className="text-[10px] text-accent-secondary uppercase tracking-wider font-semibold mb-2">Data Ekstraksi AI</p>
                    {transaction.extractionData.aiConfidence && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-text-secondary">Confidence:</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          transaction.extractionData.aiConfidence === 'high'
                            ? 'bg-accent-primary/10 text-accent-primary'
                            : transaction.extractionData.aiConfidence === 'medium'
                            ? 'bg-accent-warning/10 text-accent-warning'
                            : 'bg-accent-danger/10 text-accent-danger'
                        }`}>
                          {transaction.extractionData.aiConfidence}
                        </span>
                      </div>
                    )}
                    {transaction.extractionData.originalText && (
                      <div className="mt-2">
                        <span className="text-xs text-text-secondary">Teks asli:</span>
                        <p className="text-xs text-text-tertiary mt-0.5 italic">&quot;{transaction.extractionData.originalText}&quot;</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Edit History */}
              {editHistory.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={16} weight="duotone" className="text-text-tertiary" />
                    <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                      Riwayat Perubahan ({editHistory.length})
                    </p>
                  </div>
                  <div className="space-y-2">
                    {editHistory.slice().reverse().map((entry, i) => (
                      <div key={i} className="flex items-start gap-3 bg-bg-secondary/30 rounded-xl px-3 py-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-secondary mt-1.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-text-primary">
                            <span className="font-semibold">{FIELD_LABELS[entry.field] || entry.field}</span>
                            {' diubah dari '}
                            <span className="text-accent-danger line-through">{formatFieldValue(entry.field, entry.oldValue)}</span>
                            {' → '}
                            <span className="text-accent-primary font-semibold">{formatFieldValue(entry.field, entry.newValue)}</span>
                          </p>
                          <p className="text-[10px] text-text-tertiary mt-0.5">{getRelativeTime(entry.editedAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {onEdit && (
                  <button
                    onClick={() => { onEdit(); haptic('light'); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-accent-secondary text-text-on-accent font-bold text-sm active:scale-[0.98] transition-all"
                  >
                    <PencilSimple size={16} weight="bold" /> Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      if (confirm('Hapus transaksi ini?')) {
                        onDelete();
                        haptic('medium');
                        onClose();
                      }
                    }}
                    className="py-3.5 px-6 rounded-xl bg-accent-danger/10 text-accent-danger font-bold text-sm active:scale-[0.98] transition-all"
                  >
                    <Trash size={16} weight="bold" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================
// Pundi — Backup & Restore Page
// ============================================

"use client";

import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DownloadSimple, UploadSimple, ShieldCheck, Warning, CheckCircle, XCircle, ArrowLeft, Bell, BellSlash, Trash } from '@phosphor-icons/react';
import { useBackupStore, BackupData } from '@/lib/stores/data-backup-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { useDebtStore } from '@/lib/stores/debt-store';
import { useReceivableStore } from '@/lib/stores/receivable-store';
import { haptic } from '@/lib/utils/haptic';
import Link from 'next/link';

type ImportMode = 'replace' | 'merge';

interface ImportPreview {
  backup: BackupData;
  counts: {
    transactions: number;
    wallets: number;
    debts: number;
    receivables: number;
    splitBills: number;
    budgets: number;
    recurring: number;
  };
}

export default function BackupPage() {
  const { lastBackupDate, backupReminderEnabled, backupReminderIntervalDays, exportAllData, importData, validateImport, setBackupReminder } = useBackupStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('replace');
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; counts: Record<string, number> } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showReminderSettings, setShowReminderSettings] = useState(false);

  // Current data stats
  const txCount = useTransactionStore((s) => s.transactions.length);
  const walletCount = useWalletStore((s) => s.wallets.length);
  const debtCount = useDebtStore((s) => s.debts.length);
  const recCount = useReceivableStore((s) => s.receivables.length);

  const [now] = useState(() => Date.now());
  const lastBackupAgo = useMemo(() => {
    if (!lastBackupDate) return null;
    const diff = now - new Date(lastBackupDate).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} hari lalu`;
    const weeks = Math.floor(days / 7);
    return `${weeks} minggu lalu`;
  }, [lastBackupDate, now]);

  const handleExport = () => {
    setIsExporting(true);
    haptic('medium');

    try {
      const data = exportAllData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const dateStr = new Date().toISOString().split('T')[0];
      const a = document.createElement('a');
      a.href = url;
      a.download = `pundi-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      haptic('success');
    } catch (err) {
      console.error('[Backup] Export failed:', err);
      alert('Gagal export data. Coba lagi ya.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        const validation = validateImport(parsed);

        if (!validation.valid) {
          alert(`File tidak valid:\n${validation.errors.join('\n')}`);
          return;
        }

        const backup = parsed as BackupData;
        const d = backup.data;

        setImportPreview({
          backup,
          counts: {
            transactions: Array.isArray(d.transactions) ? d.transactions.length : 0,
            wallets: Array.isArray(d.wallets) ? d.wallets.length : 0,
            debts: Array.isArray(d.debts) ? d.debts.length : 0,
            receivables: Array.isArray(d.receivables) ? d.receivables.length : 0,
            splitBills: Array.isArray(d.splitBillSessions) ? d.splitBillSessions.length : 0,
            budgets: Array.isArray(d.budgets) ? d.budgets.length : 0,
            recurring: Array.isArray(d.recurring) ? d.recurring.length : 0,
          },
        });
        setImportResult(null);
        haptic('light');
      } catch {
        alert('File bukan JSON yang valid.');
      }
    };
    reader.readAsText(file);

    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleImport = () => {
    if (!importPreview) return;
    haptic('medium');

    if (importMode === 'replace') {
      if (!confirm('⚠️ Mode Ganti: Semua data yang ada sekarang akan ditimpa dengan data dari file backup. Lanjutkan?')) {
        return;
      }
    }

    const result = importData(importPreview.backup, importMode);
    setImportResult(result);
    setImportPreview(null);

    if (result.success) {
      haptic('success');
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="pt-safe">
        <div className="px-5 pt-4 pb-3 flex items-center gap-3">
          <Link
            href="/profile"
            onClick={() => haptic('light')}
            className="w-9 h-9 rounded-full bg-bg-elevated shadow-[0_2px_12px_rgba(0,0,0,0.06)] flex items-center justify-center"
          >
            <ArrowLeft size={20} weight="bold" className="text-text-primary" />
          </Link>
          <motion.h1
            className="text-[28px] font-bold text-text-primary tracking-tight"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Backup & Restore
          </motion.h1>
        </div>
      </div>

      <div className="px-5 pb-8 space-y-5">
        {/* Last Backup Status */}
        <motion.div
          className={`rounded-[20px] p-5 border ${
            lastBackupDate
              ? 'bg-accent-primary/5 border-accent-primary/20'
              : 'bg-accent-warning/5 border-accent-warning/20'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              lastBackupDate ? 'bg-accent-primary/15' : 'bg-accent-warning/15'
            }`}>
              {lastBackupDate ? (
                <ShieldCheck size={24} weight="duotone" className="text-accent-primary" />
              ) : (
                <Warning size={24} weight="duotone" className="text-accent-warning" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-text-primary">
                {lastBackupDate ? 'Data Terbackup ✅' : 'Belum Pernah Backup ⚠️'}
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                {lastBackupDate
                  ? `Backup terakhir: ${lastBackupAgo}`
                  : 'Data keuanganmu hanya tersimpan di device ini. Export sekarang biar aman!'}
              </p>
              {lastBackupDate && (
                <p className="text-[11px] text-text-tertiary mt-1 tabular-nums">
                  {new Date(lastBackupDate).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Current Data Stats */}
        <motion.div
          className="rounded-[14px] bg-bg-elevated shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Data Saat Ini</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Transaksi', count: txCount, emoji: '📝' },
              { label: 'Wallet', count: walletCount, emoji: '💰' },
              { label: 'Hutang', count: debtCount, emoji: '📋' },
              { label: 'Piutang', count: recCount, emoji: '📩' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 bg-bg-secondary/50 rounded-xl px-3 py-2">
                <span className="text-lg">{item.emoji}</span>
                <div>
                  <p className="text-sm font-bold text-text-primary tabular-nums">{item.count}</p>
                  <p className="text-[10px] text-text-tertiary">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Export Button */}
        <motion.button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full flex items-center gap-4 p-5 rounded-[20px] bg-gradient-to-r from-accent-primary to-accent-primary-hover text-white active:scale-[0.98] transition-all shadow-lg disabled:opacity-60"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <DownloadSimple size={24} weight="bold" />
          </div>
          <div className="text-left flex-1">
            <p className="text-base font-bold">Export Semua Data</p>
            <p className="text-xs text-white/70 mt-0.5">Download file JSON ke device kamu</p>
          </div>
        </motion.button>

        {/* Import Button */}
        <motion.button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center gap-4 p-5 rounded-[20px] bg-bg-elevated shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-border-light active:scale-[0.98] transition-all"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-12 h-12 rounded-full bg-accent-secondary/10 flex items-center justify-center">
            <UploadSimple size={24} weight="bold" className="text-accent-secondary" />
          </div>
          <div className="text-left flex-1">
            <p className="text-base font-bold text-text-primary">Import dari File</p>
            <p className="text-xs text-text-secondary mt-0.5">Restore data dari file backup JSON</p>
          </div>
        </motion.button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Import Preview Modal */}
        <AnimatePresence>
          {importPreview && (
            <motion.div
              className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setImportPreview(null)}
            >
              <motion.div
                className="w-full max-w-lg bg-bg-elevated rounded-t-[24px] p-6"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-10 h-1 rounded-full bg-border-medium mx-auto mb-5" />
                <h3 className="text-lg font-bold text-text-primary mb-1">Preview Import</h3>
                <p className="text-xs text-text-secondary mb-4">
                  File backup dari {new Date(importPreview.backup.exportedAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                </p>

                {/* Counts */}
                <div className="space-y-2 mb-5">
                  {Object.entries(importPreview.counts).filter(([, v]) => v > 0).map(([key, count]) => (
                    <div key={key} className="flex justify-between items-center bg-bg-secondary/50 rounded-xl px-4 py-2.5">
                      <span className="text-sm text-text-secondary capitalize">{key}</span>
                      <span className="text-sm font-bold text-text-primary tabular-nums">{count} item</span>
                    </div>
                  ))}
                </div>

                {/* Mode Selection */}
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Mode Import</p>
                <div className="flex gap-2 mb-5">
                  <button
                    onClick={() => { setImportMode('replace'); haptic('light'); }}
                    className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                      importMode === 'replace'
                        ? 'border-accent-danger bg-accent-danger/5'
                        : 'border-border-light bg-bg-elevated'
                    }`}
                  >
                    <Trash size={20} className={importMode === 'replace' ? 'text-accent-danger mx-auto mb-1' : 'text-text-tertiary mx-auto mb-1'} />
                    <p className={`text-xs font-bold text-center ${importMode === 'replace' ? 'text-accent-danger' : 'text-text-secondary'}`}>Ganti Semua</p>
                    <p className="text-[10px] text-text-tertiary text-center mt-0.5">Timpa data lama</p>
                  </button>
                  <button
                    onClick={() => { setImportMode('merge'); haptic('light'); }}
                    className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                      importMode === 'merge'
                        ? 'border-accent-primary bg-accent-primary/5'
                        : 'border-border-light bg-bg-elevated'
                    }`}
                  >
                    <CheckCircle size={20} className={importMode === 'merge' ? 'text-accent-primary mx-auto mb-1' : 'text-text-tertiary mx-auto mb-1'} />
                    <p className={`text-xs font-bold text-center ${importMode === 'merge' ? 'text-accent-primary' : 'text-text-secondary'}`}>Gabungkan</p>
                    <p className="text-[10px] text-text-tertiary text-center mt-0.5">Tambah yg belum ada</p>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setImportPreview(null)}
                    className="flex-1 py-3 rounded-xl bg-bg-secondary text-text-secondary font-semibold text-sm"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleImport}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm text-white ${
                      importMode === 'replace' ? 'bg-accent-danger' : 'bg-accent-primary'
                    }`}
                  >
                    Import Sekarang
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Import Result */}
        <AnimatePresence>
          {importResult && (
            <motion.div
              className={`rounded-[14px] p-4 border ${
                importResult.success
                  ? 'bg-accent-primary/5 border-accent-primary/20'
                  : 'bg-accent-danger/5 border-accent-danger/20'
              }`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="flex items-center gap-3">
                {importResult.success ? (
                  <CheckCircle size={24} weight="fill" className="text-accent-primary" />
                ) : (
                  <XCircle size={24} weight="fill" className="text-accent-danger" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-bold text-text-primary">{importResult.message}</p>
                  {importResult.success && Object.keys(importResult.counts).length > 0 && (
                    <p className="text-xs text-text-secondary mt-0.5">
                      {Object.entries(importResult.counts)
                        .filter(([, v]) => v > 0)
                        .map(([k, v]) => `${v} ${k}`)
                        .join(', ')}
                    </p>
                  )}
                </div>
                <button onClick={() => setImportResult(null)} className="text-text-tertiary">
                  <XCircle size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Backup Reminder Settings */}
        <motion.div
          className="rounded-[14px] bg-bg-elevated shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={() => { setShowReminderSettings(!showReminderSettings); haptic('light'); }}
            className="w-full flex items-center gap-3 p-4"
          >
            {backupReminderEnabled ? (
              <Bell size={20} weight="duotone" className="text-accent-secondary" />
            ) : (
              <BellSlash size={20} weight="duotone" className="text-text-tertiary" />
            )}
            <span className="text-sm text-text-primary flex-1 text-left font-medium">
              Pengingat Backup
            </span>
            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
              backupReminderEnabled
                ? 'bg-accent-primary/10 text-accent-primary'
                : 'bg-bg-secondary text-text-tertiary'
            }`}>
              {backupReminderEnabled ? `Setiap ${backupReminderIntervalDays} hari` : 'Mati'}
            </span>
          </button>

          <AnimatePresence>
            {showReminderSettings && (
              <motion.div
                className="px-4 pb-4 pt-0 space-y-3 border-t border-border-light"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <div className="flex items-center justify-between pt-3">
                  <span className="text-xs text-text-secondary">Aktifkan Pengingat</span>
                  <button
                    onClick={() => { setBackupReminder(!backupReminderEnabled); haptic('light'); }}
                    className={`w-11 h-6 rounded-full transition-all relative ${
                      backupReminderEnabled ? 'bg-accent-primary' : 'bg-bg-secondary'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                      backupReminderEnabled ? 'left-[22px]' : 'left-0.5'
                    }`} />
                  </button>
                </div>

                {backupReminderEnabled && (
                  <div className="flex gap-2">
                    {[1, 3, 7, 14, 30].map((days) => (
                      <button
                        key={days}
                        onClick={() => { setBackupReminder(true, days); haptic('light'); }}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                          backupReminderIntervalDays === days
                            ? 'bg-accent-secondary text-white'
                            : 'bg-bg-secondary text-text-secondary'
                        }`}
                      >
                        {days}h
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Encrypted Backup Placeholder */}
        <motion.div
          className="rounded-[14px] bg-bg-elevated shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-4 opacity-50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.5, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center">
              <ShieldCheck size={20} weight="duotone" className="text-text-tertiary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-secondary">Encrypted Backup</p>
              <p className="text-xs text-text-tertiary mt-0.5">Segera hadir 🔒</p>
            </div>
            <span className="px-2 py-1 rounded-full bg-bg-secondary text-[10px] text-text-tertiary font-bold uppercase">Soon</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

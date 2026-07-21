// ============================================
// Pundi — Category Management Page
// ============================================

"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Plus, Archive, ArrowsClockwise, PencilSimple, Trash } from '@phosphor-icons/react';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { CategoryFormSheet } from '@/components/categories/CategoryFormSheet';
import { useCategoryStore } from '@/lib/stores/category-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { CategoryType } from '@/lib/types';
import { haptic } from '@/lib/utils/haptic';

export default function CategoriesPage() {
  const { categories, addCategory, updateCategory, archiveCategory, unarchiveCategory, deleteCategory } = useCategoryStore();
  const { transactions } = useTransactionStore();

  const [showForm, setShowForm] = useState(false);
  const [editingCat, setEditingCat] = useState<{ id: string; name: string; type: CategoryType; icon: string; color: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [showArchived, setShowArchived] = useState(false);
  const [mergeSource, setMergeSource] = useState<string | null>(null);

  // Count transactions per category
  const txCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((tx) => {
      map[tx.category_id] = (map[tx.category_id] || 0) + 1;
    });
    return map;
  }, [transactions]);

  const filteredCategories = useMemo(() => {
    return categories
      .filter((c) => c.type === activeTab)
      .filter((c) => showArchived ? c.isArchived : !c.isArchived)
      .sort((a, b) => a.order - b.order);
  }, [categories, activeTab, showArchived]);

  const handleAddCategory = (data: { name: string; type: CategoryType; icon: string; color: string }) => {
    addCategory(data);
    haptic('success');
  };

  const handleEditCategory = (data: { name: string; type: CategoryType; icon: string; color: string }) => {
    if (!editingCat) return;
    updateCategory(editingCat.id, data);
    setEditingCat(null);
    haptic('success');
  };

  const handleMerge = (targetId: string) => {
    if (!mergeSource || mergeSource === targetId) return;

    const sourceCat = categories.find((c) => c.id === mergeSource);
    const targetCat = categories.find((c) => c.id === targetId);
    if (!sourceCat || !targetCat) return;

    if (!confirm(`Gabungkan "${sourceCat.name}" ke "${targetCat.name}"?\n\nSemua transaksi dari "${sourceCat.name}" akan dipindah ke "${targetCat.name}".`)) {
      setMergeSource(null);
      return;
    }

    // Reassign transactions
    const txStore = useTransactionStore.getState();
    transactions.forEach((tx) => {
      if (tx.category_id === mergeSource) {
        txStore.updateTransaction(tx.id, { category_id: targetId });
      }
    });

    // Archive the source
    archiveCategory(mergeSource);
    setMergeSource(null);
    haptic('success');
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
            className="text-[28px] font-bold text-text-primary tracking-tight flex-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Kategori
          </motion.h1>
          <button
            onClick={() => { setShowForm(true); haptic('light'); }}
            className="w-9 h-9 rounded-full bg-accent-secondary text-text-on-accent flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <Plus size={18} weight="bold" />
          </button>
        </div>
      </div>

      <div className="px-5 pb-8 space-y-4">
        {/* Type Tabs */}
        <div className="flex gap-2">
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setActiveTab(t); haptic('light'); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === t
                  ? t === 'expense'
                    ? 'bg-accent-danger/10 text-accent-danger'
                    : 'bg-accent-primary/10 text-accent-primary'
                  : 'bg-bg-secondary text-text-tertiary'
              }`}
            >
              {t === 'expense' ? '💸 Pengeluaran' : '💰 Pemasukan'}
            </button>
          ))}
        </div>

        {/* Toggle Archived */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
            {showArchived ? 'Kategori Diarsipkan' : 'Kategori Aktif'}
          </span>
          <button
            onClick={() => { setShowArchived(!showArchived); haptic('light'); }}
            className="text-xs text-accent-secondary font-semibold flex items-center gap-1"
          >
            <Archive size={14} />
            {showArchived ? 'Lihat Aktif' : 'Lihat Arsip'}
          </button>
        </div>

        {/* Merge Mode Banner */}
        <AnimatePresence>
          {mergeSource && (
            <motion.div
              className="rounded-xl bg-accent-warning/10 border border-accent-warning/30 px-4 py-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-accent-warning font-semibold">
                  🔀 Pilih kategori tujuan untuk menggabungkan
                </p>
                <button
                  onClick={() => setMergeSource(null)}
                  className="text-xs text-text-secondary font-medium"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Grid */}
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📂</p>
            <p className="text-sm text-text-secondary">
              {showArchived ? 'Belum ada kategori yang diarsipkan' : 'Belum ada kategori'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCategories.map((cat, index) => (
              <motion.div
                key={cat.id}
                className={`flex items-center gap-3 p-4 rounded-[14px] bg-bg-elevated shadow-[0_2px_12px_rgba(0,0,0,0.06)] ${
                  mergeSource && mergeSource !== cat.id ? 'ring-2 ring-accent-warning/30 cursor-pointer' : ''
                } ${mergeSource === cat.id ? 'ring-2 ring-accent-secondary' : ''}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => mergeSource && mergeSource !== cat.id ? handleMerge(cat.id) : undefined}
              >
                {/* Icon */}
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: cat.color + '20' }}
                >
                  <DynamicIcon name={cat.icon} size={22} weight="duotone" style={{ color: cat.color }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{cat.name}</p>
                  <p className="text-[11px] text-text-tertiary">
                    {txCountMap[cat.id] || 0} transaksi
                    {cat.isCustom && ' · Custom'}
                    {cat.isArchived && ' · Diarsipkan'}
                  </p>
                </div>

                {/* Actions */}
                {!mergeSource && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCat({ id: cat.id, name: cat.name, type: cat.type, icon: cat.icon, color: cat.color });
                        haptic('light');
                      }}
                      className="w-8 h-8 rounded-lg bg-bg-secondary flex items-center justify-center"
                    >
                      <PencilSimple size={14} className="text-text-secondary" />
                    </button>

                    {!showArchived && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMergeSource(cat.id);
                          haptic('light');
                        }}
                        className="w-8 h-8 rounded-lg bg-bg-secondary flex items-center justify-center"
                        title="Gabungkan ke kategori lain"
                      >
                        <ArrowsClockwise size={14} className="text-text-secondary" />
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (cat.isArchived) {
                          unarchiveCategory(cat.id);
                        } else {
                          archiveCategory(cat.id);
                        }
                        haptic('light');
                      }}
                      className="w-8 h-8 rounded-lg bg-bg-secondary flex items-center justify-center"
                    >
                      <Archive size={14} className={cat.isArchived ? 'text-accent-primary' : 'text-text-tertiary'} />
                    </button>

                    {cat.isCustom && cat.isArchived && (txCountMap[cat.id] || 0) === 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Hapus kategori "${cat.name}" secara permanen?`)) {
                            deleteCategory(cat.id);
                            haptic('medium');
                          }
                        }}
                        className="w-8 h-8 rounded-lg bg-accent-danger/10 flex items-center justify-center"
                      >
                        <Trash size={14} className="text-accent-danger" />
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Category Sheet */}
      <CategoryFormSheet
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleAddCategory}
        mode="add"
      />

      {/* Edit Category Sheet */}
      <CategoryFormSheet
        isOpen={!!editingCat}
        onClose={() => setEditingCat(null)}
        onSave={handleEditCategory}
        initialData={editingCat || undefined}
        mode="edit"
      />
    </div>
  );
}

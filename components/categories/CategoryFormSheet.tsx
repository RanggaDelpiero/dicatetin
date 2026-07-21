// ============================================
// Pundi — Category Form Sheet (Bottom Sheet)
// ============================================

"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from '@phosphor-icons/react';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { CategoryType } from '@/lib/types';
import { haptic } from '@/lib/utils/haptic';

const ICON_OPTIONS = [
  'ForkKnife', 'Car', 'ShoppingCart', 'GameController', 'Receipt', 'Heart',
  'GraduationCap', 'Coffee', 'Basket', 'Repeat', 'HandHeart', 'DotsThree',
  'Money', 'Laptop', 'TrendUp', 'Gift', 'House', 'Airplane', 'Dog', 'Barbell',
  'MusicNote', 'Book', 'Camera', 'PaintBrush', 'Wrench', 'Baby', 'Pill',
  'ShoppingBag', 'Bus', 'Bicycle', 'Lightning', 'Drop', 'Ticket',
];

const COLOR_OPTIONS = [
  '#F97316', '#3B82F6', '#EC4899', '#8B5CF6', '#EF4444', '#10B981',
  '#6366F1', '#92400E', '#059669', '#7C3AED', '#D97706', '#6B7280',
  '#22C55E', '#06B6D4', '#14B8A6', '#F43F5E', '#A855F7', '#84CC16',
];

interface CategoryFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; type: CategoryType; icon: string; color: string }) => void;
  initialData?: {
    name: string;
    type: CategoryType;
    icon: string;
    color: string;
  };
  mode?: 'add' | 'edit';
}

export function CategoryFormSheet({ isOpen, onClose, onSave, initialData, mode = 'add' }: CategoryFormSheetProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState<CategoryType>(initialData?.type || 'expense');
  const [icon, setIcon] = useState(initialData?.icon || 'DotsThree');
  const [color, setColor] = useState(initialData?.color || '#6B7280');

  useEffect(() => {
    if (isOpen && initialData) {
      const timer = setTimeout(() => {
        setName(initialData.name);
        setType(initialData.type);
        setIcon(initialData.icon);
        setColor(initialData.color);
      }, 0);
      return () => clearTimeout(timer);
    } else if (isOpen && !initialData) {
      const timer = setTimeout(() => {
        setName('');
        setType('expense');
        setIcon('DotsThree');
        setColor('#6B7280');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialData]);

  const handleSave = () => {
    if (!name.trim()) return;
    haptic('medium');
    onSave({ name: name.trim(), type, icon, color });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-bg-elevated rounded-t-[24px] max-h-[85vh] overflow-y-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="p-5 pb-safe">
              {/* Handle */}
              <div className="w-10 h-1 rounded-full bg-border-medium mx-auto mb-4" />

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-text-primary">
                  {mode === 'add' ? 'Kategori Baru' : 'Edit Kategori'}
                </h2>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center">
                  <X size={18} weight="bold" className="text-text-secondary" />
                </button>
              </div>

              {/* Type Toggle */}
              <div className="flex gap-2 mb-5">
                {(['expense', 'income'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setType(t); haptic('light'); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      type === t
                        ? t === 'expense'
                          ? 'bg-accent-danger text-text-on-accent'
                          : 'bg-accent-primary text-text-on-accent'
                        : 'bg-bg-secondary text-text-secondary'
                    }`}
                  >
                    {t === 'expense' ? '💸 Pengeluaran' : '💰 Pemasukan'}
                  </button>
                ))}
              </div>

              {/* Preview */}
              <div className="flex items-center gap-3 mb-5 p-4 rounded-[14px] bg-bg-secondary/50">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: color + '20' }}
                >
                  <DynamicIcon name={icon} size={24} weight="duotone" style={{ color }} />
                </div>
                <div>
                  <p className="text-base font-bold text-text-primary">{name || 'Nama Kategori'}</p>
                  <p className="text-xs text-text-tertiary">{type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}</p>
                </div>
              </div>

              {/* Name Input */}
              <label className="block mb-4">
                <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Nama Kategori</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Gym, Langganan, Jajan..."
                  className="w-full mt-1.5 px-4 py-3 rounded-xl bg-bg-secondary text-text-primary text-sm placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-accent-secondary/30"
                  maxLength={30}
                />
              </label>

              {/* Icon Picker */}
              <div className="mb-4">
                <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Ikon</span>
                <div className="grid grid-cols-8 gap-2 mt-2">
                  {ICON_OPTIONS.map((iconName) => (
                    <button
                      key={iconName}
                      onClick={() => { setIcon(iconName); haptic('light'); }}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        icon === iconName
                          ? 'bg-accent-secondary/15 ring-2 ring-accent-secondary scale-110'
                          : 'bg-bg-secondary'
                      }`}
                    >
                      <DynamicIcon
                        name={iconName}
                        size={20}
                        weight={icon === iconName ? 'duotone' : 'regular'}
                        className={icon === iconName ? 'text-accent-secondary' : 'text-text-secondary'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Picker */}
              <div className="mb-6">
                <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Warna</span>
                <div className="grid grid-cols-9 gap-2 mt-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => { setColor(c); haptic('light'); }}
                      className="relative w-9 h-9 rounded-full transition-all"
                      style={{ backgroundColor: c }}
                    >
                      {color === c && (
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <Check size={16} weight="bold" className="text-text-on-accent" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={!name.trim()}
                className="w-full py-4 rounded-xl bg-accent-secondary text-text-on-accent font-bold text-base disabled:opacity-40 active:scale-[0.98] transition-all"
              >
                {mode === 'add' ? 'Tambah Kategori ✨' : 'Simpan Perubahan'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

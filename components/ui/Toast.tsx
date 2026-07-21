// ============================================
// Pundi — Toast Notification System
// Replaces all native alert() calls with polished in-app toasts
// ============================================

"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Warning, Info, X } from '@phosphor-icons/react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle,
  error: XCircle,
  warning: Warning,
  info: Info,
};

const STYLES: Record<ToastType, { bg: string; icon: string; border: string }> = {
  success: {
    bg: 'bg-bg-elevated',
    icon: 'text-accent-primary',
    border: 'border-accent-primary/20',
  },
  error: {
    bg: 'bg-bg-elevated',
    icon: 'text-accent-danger',
    border: 'border-accent-danger/20',
  },
  warning: {
    bg: 'bg-bg-elevated',
    icon: 'text-accent-warning',
    border: 'border-accent-warning/20',
  },
  info: {
    bg: 'bg-bg-elevated',
    icon: 'text-accent-secondary',
    border: 'border-accent-secondary/20',
  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const { bg, icon, border } = STYLES[toast.type];
  const Icon = ICONS[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration ?? 3500);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-elevated max-w-sm w-full ${bg} ${border}`}
    >
      <Icon size={20} weight="fill" className={`flex-shrink-0 mt-0.5 ${icon}`} />
      <p className="flex-1 text-sm font-medium text-text-primary leading-snug">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-text-tertiary active:scale-90 transition-transform"
        aria-label="Tutup notifikasi"
      >
        <X size={16} weight="bold" />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev.slice(-4), { id, message, type, duration }]);
  }, []);

  const value: ToastContextValue = {
    toast: addToast,
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container — sits above tab bar */}
      <div
        className="fixed bottom-[calc(var(--tab-bar-height)+24px)] left-0 right-0 z-[200] flex flex-col items-center gap-2 px-4 pointer-events-none"
        aria-live="polite"
        aria-label="Notifikasi"
      >
        <AnimatePresence mode="sync">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto w-full flex justify-center">
              <ToastItem toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

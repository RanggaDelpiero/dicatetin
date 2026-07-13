// ============================================
// Pundi — Notification Center (Bottom Sheet)
// ============================================

"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Bell, Fire, CurrencyCircleDollar, ArrowsClockwise, Siren, EnvelopeSimple } from '@phosphor-icons/react';
import { useNotificationStore, NotificationType } from '@/lib/stores/notification-store';
import { haptic } from '@/lib/utils/haptic';
import Link from 'next/link';

const TYPE_CONFIG: Record<NotificationType, { icon: React.ReactNode; color: string; bg: string }> = {
  debt_due: {
    icon: <Siren size={18} weight="duotone" />,
    color: 'text-accent-danger',
    bg: 'bg-accent-danger/10',
  },
  recurring_upcoming: {
    icon: <ArrowsClockwise size={18} weight="duotone" />,
    color: 'text-accent-secondary',
    bg: 'bg-accent-secondary/10',
  },
  streak_risk: {
    icon: <Fire size={18} weight="duotone" />,
    color: 'text-accent-warning',
    bg: 'bg-accent-warning/10',
  },
  budget_warning: {
    icon: <CurrencyCircleDollar size={18} weight="duotone" />,
    color: 'text-accent-danger',
    bg: 'bg-accent-danger/10',
  },
  receivable_followup: {
    icon: <EnvelopeSimple size={18} weight="duotone" />,
    color: 'text-accent-primary',
    bg: 'bg-accent-primary/10',
  },
};

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { notifications, markAsRead, markAllAsRead, clearAll, getUnreadCount } = useNotificationStore();
  const unreadCount = getUnreadCount();

  // Sort: unread first, then by priority, then by date
  const sortedNotifs = [...notifications].sort((a, b) => {
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

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
            className="fixed bottom-0 left-0 right-0 z-50 bg-bg-elevated rounded-t-[24px] max-h-[70vh] flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Handle + Header */}
            <div className="px-5 pt-3 pb-3 border-b border-border-light flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-border-medium mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell size={20} weight="duotone" className="text-accent-secondary" />
                  <h2 className="text-lg font-bold text-text-primary">Notifikasi</h2>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-accent-danger text-white text-[10px] font-bold">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => { markAllAsRead(); haptic('light'); }}
                      className="text-xs text-accent-secondary font-semibold flex items-center gap-1"
                    >
                      <CheckCircle size={14} /> Tandai semua
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="w-7 h-7 rounded-full bg-bg-secondary flex items-center justify-center"
                  >
                    <X size={14} weight="bold" className="text-text-secondary" />
                  </button>
                </div>
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {sortedNotifs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">🔔</p>
                  <p className="text-sm text-text-secondary">Belum ada notifikasi</p>
                  <p className="text-xs text-text-tertiary mt-1">Semua aman! 😊</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedNotifs.map((notif, index) => {
                    const config = TYPE_CONFIG[notif.type];
                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Link
                          href={notif.actionUrl}
                          onClick={() => {
                            markAsRead(notif.id);
                            haptic('light');
                            onClose();
                          }}
                          className={`flex items-start gap-3 p-3 rounded-[14px] transition-all ${
                            notif.isRead
                              ? 'bg-bg-secondary/30'
                              : 'bg-bg-elevated shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                            <span className={config.color}>{config.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${
                              notif.isRead ? 'text-text-secondary' : 'text-text-primary'
                            }`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-text-tertiary mt-0.5 truncate">{notif.body}</p>
                          </div>
                          {!notif.isRead && (
                            <div className="w-2 h-2 rounded-full bg-accent-secondary mt-2 flex-shrink-0" />
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Clear All */}
            {notifications.length > 0 && (
              <div className="px-5 py-3 border-t border-border-light flex-shrink-0">
                <button
                  onClick={() => { clearAll(); haptic('light'); }}
                  className="w-full text-center text-xs text-text-tertiary font-medium py-2"
                >
                  Hapus Semua Notifikasi
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

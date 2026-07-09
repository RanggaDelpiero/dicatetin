// ============================================
// Pundi — AI Advisor Page
// ============================================

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CaretLeft, Trash, PaperPlaneTilt, Robot } from '@phosphor-icons/react';
import { useAdvisorStore } from '@/lib/stores/advisor-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { useGamificationStore } from '@/lib/stores/gamification-store';
import { useDebtStore } from '@/lib/stores/debt-store';
import { useReceivableStore } from '@/lib/stores/receivable-store';
import { buildFinancialContext } from '@/lib/ai/context';
import { haptic } from '@/lib/utils/haptic';
import { getCurrentMonthRange } from '@/lib/utils/date';
import { XP_REWARDS } from '@/lib/gamification/xp';

const SUGGESTIONS = [
  'Analisa bulan ini 📊',
  'Saran hemat jajan ☕',
  'Tips lunasi hutang 📈',
  'Berapa level & streak-ku? 🔥',
];

export default function AdvisorPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');

  // Stores
  const { messages, isLoading, addUserMessage, addAssistantMessage, setLoading, clearHistory } = useAdvisorStore();
  const { transactions, getCategoryTotals, getTotalByType } = useTransactionStore();
  const { wallets, getTotalBalance } = useWalletStore();
  const { progress, addXP, unlockBadge } = useGamificationStore();
  const { debts } = useDebtStore();
  const { receivables } = useReceivableStore();

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      addAssistantMessage('Halo Rangga! Aku Pundi AI 🐷, asisten keuangan pribadimu. Ada yang bisa kubantu hari ini? Kamu bisa tanya tentang kondisi kantongmu, pengeluaran bulan ini, atau tips hemat!');
    }
  }, [messages, addAssistantMessage]);

  // Assemble financial context
  const getContextString = () => {
    const { start, end } = getCurrentMonthRange();
    const totalBalance = getTotalBalance();
    const monthlyIncome = getTotalByType('income', start, end);
    const monthlyExpense = getTotalByType('expense', start, end);
    const categoryTotals = getCategoryTotals(start, end, 'expense');

    const topExpenseCategories = categoryTotals.slice(0, 5).map((ct) => ({
      name: ct.category,
      amount: ct.amount,
      percentage: ct.percentage,
    }));

    const activeDebts = debts
      .filter((d) => d.status === 'active')
      .map((d) => ({
        creditor: d.creditor,
        remaining: d.remaining_amount,
        total: d.total_amount,
      }));

    const activeReceivables = receivables
      .filter((r) => r.status !== 'paid')
      .map((r) => ({
        debtor: r.debtor,
        remaining: r.remaining_amount,
        total: r.total_amount,
      }));

    return buildFinancialContext({
      totalBalance,
      wallets: wallets.map((w) => ({ name: w.name, type: w.type, balance: w.balance })),
      monthlyIncome,
      monthlyExpense,
      topExpenseCategories,
      streakDays: progress.streak_days,
      level: progress.level,
      activeDebts,
      activeReceivables,
    });
  };

  const handleSend = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    haptic('medium');
    setInput('');
    addUserMessage(trimmed);
    setLoading(true);

    try {
      const financialContext = getContextString();
      const currentMessages = [...messages, { role: 'user', content: trimmed }];

      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: currentMessages.map((m) => ({ role: m.role, content: m.content })),
          financialContext,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Server error');
      }

      const data = await res.json();
      addAssistantMessage(data.reply);

      // Reward XP & Unlock badge on first AI usage
      if (!progress.badges.includes('ai-advisor')) {
        addXP(XP_REWARDS.AI_ADVISOR);
        unlockBadge('ai-advisor');
      }
    } catch (err: any) {
      console.error(err);
      addAssistantMessage(err.message || 'Duh, koneksi ke otak Pundi terputus. Coba kirim pesan lagi ya! 🔌');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-bg-primary pb-safe">
      {/* Header */}
      <div className="pt-safe border-b border-border-light bg-bg-elevated sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => { haptic('light'); router.back(); }}
            className="w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center text-text-primary active:scale-95 transition-transform"
          >
            <CaretLeft size={20} weight="bold" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-accent-secondary/15 flex items-center justify-center text-accent-secondary">
              <Robot size={22} weight="fill" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary leading-tight">Pundi AI Advisor</h2>
              <span className="text-[10px] text-accent-primary font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
                Online & Siap Bantu
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              haptic('medium');
              if (confirm('Hapus riwayat chat?')) clearHistory();
            }}
            className="w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center text-text-tertiary active:scale-95 transition-transform"
          >
            <Trash size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-touch no-scrollbar">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-[18px] px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                  isUser
                    ? 'bg-accent-secondary text-white rounded-tr-[4px]'
                    : 'bg-bg-elevated text-text-primary rounded-tl-[4px] border border-border-light'
                }`}
              >
                {!isUser && <span className="text-xs text-text-tertiary block mb-1">Pundi</span>}
                <p className="whitespace-pre-line">{msg.content}</p>
              </div>
            </div>
          );
        })}

        {/* Loading bubble */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-bg-elevated border border-border-light rounded-[18px] rounded-tl-[4px] px-4 py-3 flex gap-1 items-center shadow-sm">
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-text-tertiary"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-text-tertiary"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
              />
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-text-tertiary"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions and Input container */}
      <div className="p-4 bg-bg-primary border-t border-border-light">
        {/* Suggestion Chips */}
        {messages.length <= 2 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 -mx-4 px-4">
            {SUGGESTIONS.map((sug) => (
              <button
                key={sug}
                onClick={() => handleSend(sug.replace(/[📊☕📈🔥]/g, ''))}
                className="px-3.5 py-2 rounded-full bg-bg-elevated border border-border-light text-xs font-medium text-text-secondary whitespace-nowrap active:scale-95 transition-transform shadow-sm"
              >
                {sug}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder="Tanya Pundi AI..."
            disabled={isLoading}
            className="flex-1 bg-bg-elevated border border-border-light rounded-2xl px-4 py-3.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none shadow-sm focus:border-accent-secondary transition-colors"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            className={`w-[48px] h-[48px] rounded-2xl flex items-center justify-center text-white active:scale-95 transition-transform shadow-md ${
              input.trim() && !isLoading
                ? 'bg-accent-secondary'
                : 'bg-text-tertiary/30 cursor-not-allowed shadow-none'
            }`}
          >
            <PaperPlaneTilt size={20} weight="bold" />
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-text-tertiary text-center mt-3 leading-normal">
          💡 Pundi AI memberi saran berdasarkan catatanmu. Ini bukan nasihat keuangan profesional.
        </p>
      </div>
    </div>
  );
}

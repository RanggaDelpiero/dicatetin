"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkle, X, WarningCircle, CheckCircle, Info, ArrowRight, Lightbulb, SpinnerGap } from '@phosphor-icons/react';
import { useIntelligenceStore } from '@/lib/stores/intelligence-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { buildSanitizedAIPayload, SanitizeInput } from '@/lib/ai/sanitize';
import { AIInsight } from '@/lib/ai/schemas';
import { useRouter } from 'next/navigation';
import { haptic } from '@/lib/utils/haptic';

export function AutopilotFeed() {
  const router = useRouter();
  const { getActiveInsights, dismissInsight, acceptInsight, syncInsights } = useIntelligenceStore();
  const { transactions, getCategoryTotals } = useTransactionStore();
  const { wallets, getTotalBalance } = useWalletStore();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const generateInsights = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    haptic('light');

    try {
      // Build dummy period/input for now, we can refine this
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const payloadInput: SanitizeInput = {
        periodStart: start,
        periodEnd: end,
        totalIncome: 0, // mock
        totalExpense: 0, // mock
        totalBalance: getTotalBalance(),
        categoryBreakdown: [],
        transactions: transactions.slice(0, 50).map(t => ({
          id: t.id,
          amount: t.amount,
          type: t.type,
          categoryName: 'Cat',
          date: t.date,
        })),
        wallets: wallets.map(w => ({ name: w.name, type: w.type, balance: w.balance })),
        recurringItems: [],
        debts: [],
        goals: []
      };

      const sanitizedPayload = buildSanitizedAIPayload(payloadInput);

      // We use a signature based on the current transaction count so it doesn't just spam
      const dataSignature = `sig_${transactions.length}_${getTotalBalance()}`;

      const res = await fetch('/api/ai/autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sanitizedPayload, localCandidates: [] }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch insights');
      }

      const data = await res.json();
      
      if (data.insights && Array.isArray(data.insights)) {
        const newInsights: AIInsight[] = data.insights.map((ins: any) => ({
          id: `ins_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          kind: 'general',
          severity: ins.severity || 'info',
          title: ins.title,
          explanation: ins.explanation,
          suggestedAction: ins.suggestedAction,
          destinationLink: ins.destinationLink,
          dataSignature,
          createdAt: new Date().toISOString()
        }));

        syncInsights(newInsights);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal mengambil data dari AI');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (id: string) => {
    haptic('light');
    dismissInsight(id);
  };

  const handleAction = (insight: AIInsight) => {
    haptic('medium');
    if (insight.suggestedAction) {
      acceptInsight(insight.id, insight.suggestedAction);
      
      if (insight.suggestedAction.actionType === 'navigate' && insight.destinationLink) {
        router.push(insight.destinationLink);
      }
    } else {
      dismissInsight(insight.id);
    }
  };

  if (!isClient) return null;

  const activeInsights = getActiveInsights();

  const getSeverityColors = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'warning':
        return 'bg-accent-warning/10 border-accent-warning/20 text-accent-warning';
      case 'success':
        return 'bg-accent-primary/10 border-accent-primary/20 text-accent-primary';
      default:
        return 'bg-accent-secondary/10 border-accent-secondary/20 text-accent-secondary';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'warning':
        return <WarningCircle size={20} weight="fill" />;
      case 'success':
        return <CheckCircle size={20} weight="fill" />;
      default:
        return <Lightbulb size={20} weight="fill" />;
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
          <Sparkle size={16} weight="fill" className="text-accent-secondary" />
          AI Autopilot
        </h3>
        <button 
          onClick={generateInsights}
          disabled={loading}
          className="text-xs font-semibold text-accent-secondary disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-1"><SpinnerGap size={14} className="animate-spin" /> Menganalisis...</span>
          ) : 'Analisis Ulang'}
        </button>
      </div>

      {error && (
        <div className="p-3 mb-3 text-xs bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}

      {activeInsights.length === 0 && !loading && !error ? (
        <div className="p-5 text-center bg-bg-elevated border border-border-light rounded-[20px]">
          <div className="w-10 h-10 mx-auto rounded-full bg-bg-secondary flex items-center justify-center text-text-tertiary mb-2">
            <CheckCircle size={20} weight="bold" />
          </div>
          <p className="text-[13px] font-medium text-text-primary">Semua aman!</p>
          <p className="text-[11px] text-text-tertiary mt-1">Tidak ada anomali atau insight baru untuk saat ini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {activeInsights.map((insight) => (
              <motion.div
                key={insight.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: -20 }}
                className={`p-4 rounded-[20px] border relative overflow-hidden ${
                  insight.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' :
                  insight.severity === 'warning' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30' :
                  insight.severity === 'success' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30' :
                  'bg-bg-elevated border-border-light'
                }`}
              >
                <div className="flex gap-3">
                  <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getSeverityColors(insight.severity)}`}>
                    {getSeverityIcon(insight.severity)}
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <h4 className="text-[14px] font-bold text-text-primary mb-1 leading-tight">
                      {insight.title}
                    </h4>
                    <p className="text-[12px] text-text-secondary leading-relaxed">
                      {insight.explanation}
                    </p>
                    
                    {insight.suggestedAction && (
                      <button 
                        onClick={() => handleAction(insight)}
                        className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-bold text-accent-secondary bg-accent-secondary/10 px-3 py-1.5 rounded-xl active:scale-95 transition-transform"
                      >
                        {insight.suggestedAction.label}
                        <ArrowRight size={12} weight="bold" />
                      </button>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => handleDismiss(insight.id)}
                  className="absolute top-3 right-3 p-1.5 text-text-tertiary hover:text-text-primary rounded-full hover:bg-bg-secondary transition-colors"
                  aria-label="Tutup"
                >
                  <X size={14} weight="bold" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

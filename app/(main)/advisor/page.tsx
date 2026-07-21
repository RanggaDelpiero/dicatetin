// ============================================
// Pundi — AI Advisor Page
// ============================================

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  CaretLeft, Trash, PaperPlaneTilt,
  ArrowClockwise, CheckCircle, WarningCircle, 
  Info, Lightbulb, TrendUp, Sparkle, Heart, Target 
} from '@phosphor-icons/react';
import { useAdvisorStore } from '@/lib/stores/advisor-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { useGamificationStore } from '@/lib/stores/gamification-store';
import { useDebtStore } from '@/lib/stores/debt-store';
import { useReceivableStore } from '@/lib/stores/receivable-store';
import { useBudgetStore } from '@/lib/stores/budget-store';
import { useCategoryStore } from '@/lib/stores/category-store';
import { buildFinancialContext } from '@/lib/ai/context';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { AutopilotFeed } from '@/components/intelligence/AutopilotFeed';
import { formatCurrency } from '@/lib/utils/currency';
import { haptic } from '@/lib/utils/haptic';
import { useToast } from '@/components/ui/Toast';
import { getCurrentMonthRange, formatDate } from '@/lib/utils/date';
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
  const toast = useToast();
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'chat'>('overview');

  // Stores
  const { 
    messages, isLoading, addUserMessage, addAssistantMessage, 
    setLoading, clearHistory, report, isReportLoading, setReport, setReportLoading 
  } = useAdvisorStore();
  const { getCategoryTotals, getTotalByType } = useTransactionStore();
  const { wallets, getTotalBalance } = useWalletStore();
  const { progress, addXP, unlockBadge } = useGamificationStore();
  const { debts } = useDebtStore();
  const { receivables } = useReceivableStore();
  const { budgets } = useBudgetStore();
  const { categories } = useCategoryStore();

  const generateReport = async () => {
    haptic('medium');
    setReportLoading(true);
    
    try {
      const financialContext = getContextString();
      const promptText = `Lakukan analisis mendalam terhadap struktur keuanganku saat ini.
Tugasmu:
1. Hitung rasio tabungan terhadap pemasukan, rasio hutang terhadap aset, dan rasio beban tetap.
2. Identifikasi kebocoran halus atau pengeluaran impulsif.
3. Berikan saran alokasi yang lebih baik (misal metode 50/30/20) sesuai data riil.

Kembalikan respon HANYA berupa JSON mentah dengan struktur berikut:
{
  "healthScore": <nilai_integer_1_sampai_100_evaluasi_kritis>,
  "summary": "<ulasan_tajam_dan_mendalam_kondisi_keuanganku_3_atau_4_kalimat>",
  "breakdown": [
    { "title": "<aspek_analisis_misal_Pemasukan_atau_Rasio_Hutang>", "desc": "<angka_detail_dan_opini>", "status": "good" | "warning" | "neutral" }
  ],
  "recommendations": [
    "<saran_tindakan_spesifik_angka_1>",
    "<saran_tindakan_spesifik_angka_2>",
    "<saran_tindakan_spesifik_angka_3>"
  ]
}`;

      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: promptText }],
          financialContext,
          mode: 'analysis',
        }),
      });

      if (!res.ok) {
        throw new Error('Gagal menghubungi AI.');
      }

      const data = await res.json();
      const reply = data.reply;
      
      let cleanReply = reply.trim();
      const firstBrace = cleanReply.indexOf('{');
      const lastBrace = cleanReply.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanReply = cleanReply.substring(firstBrace, lastBrace + 1);
      }
      
      let parsedReport;
      try {
        parsedReport = JSON.parse(cleanReply);
      } catch (err) {
        console.warn('[AI Advisor] Failed to parse JSON, using fallback.', err);
        parsedReport = {
          healthScore: 50,
          summary: "Laporan belum bisa ditampilkan secara rinci karena ada sedikit gangguan komunikasi dengan server AI. Namun sistem mencatat sebagian data berhasil dikalkulasi.",
          breakdown: [
            { title: "Status Data", desc: "Sebagian data pengeluaran dan pemasukan tidak dapat diekstrak secara sempurna.", status: "warning" },
            { title: "Analisis Rasio", desc: "Rasio tabungan dan hutang belum dapat dinilai secara akurat pada percobaan ini.", status: "neutral" }
          ],
          recommendations: [
            "Silakan muat ulang (refresh) dan coba klik 'Mulai Analisis Keuangan' sekali lagi.",
            "Pastikan Anda telah memasukkan data transaksi yang cukup untuk dianalisis."
          ]
        };
      }

      setReport({
        ...parsedReport,
        lastGeneratedAt: new Date().toISOString(),
      });
      haptic('success');

      // Reward XP & Unlock badge on first AI usage
      if (!progress.badges.includes('ai-advisor')) {
        addXP(XP_REWARDS.AI_ADVISOR);
        unlockBadge('ai-advisor');
      }
    } catch (err: unknown) {
      console.error(err);
      haptic('error');
      toast.error('Gagal membuat laporan analisis keuangan AI. Silakan coba lagi.');
    } finally {
      setReportLoading(false);
    }
  };

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
      addAssistantMessage('Halo Rangga! Aku DicatetinAja AI 🤖, asisten keuangan pribadimu. Ada yang bisa kubantu hari ini? Kamu bisa tanya tentang kondisi kantongmu, pengeluaran bulan ini, atau tips hemat!');
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
    } catch (err: unknown) {
      console.error(err);
      addAssistantMessage((err as Error).message || 'Duh, koneksi ke otak DicatetinAja terputus. Coba kirim pesan lagi ya! 🔌');
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

          {/* Segmented Control */}
          <div className="flex bg-bg-secondary p-1 rounded-xl w-[220px] shadow-inner">
            <button
              onClick={() => { haptic('light'); setActiveTab('overview'); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'overview' ? 'bg-bg-elevated text-text-primary shadow-sm' : 'text-text-tertiary'
              }`}
            >
              Command Center
            </button>
            <button
              onClick={() => { haptic('light'); setActiveTab('chat'); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'chat' ? 'bg-bg-elevated text-text-primary shadow-sm' : 'text-text-tertiary'
              }`}
            >
              Tanya AI
            </button>
          </div>

          {activeTab === 'overview' ? (
            <button
              onClick={generateReport}
              disabled={isReportLoading}
              className={`w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center text-text-primary active:scale-95 transition-transform ${
                isReportLoading ? 'animate-spin opacity-50' : ''
              }`}
              title="Perbarui Analisis"
            >
              <ArrowClockwise size={16} weight="bold" />
            </button>
          ) : (
            <button
              onClick={() => {
                haptic('medium');
                if (confirm('Hapus riwayat chat?')) clearHistory();
              }}
              className="w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center text-text-tertiary active:scale-95 transition-transform"
              title="Hapus Chat"
            >
              <Trash size={16} />
            </button>
          )}
        </div>
      </div>

      {activeTab === 'overview' ? (
        // ============================================
        // DASHBOARD AI VIEW
        // ============================================
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 scroll-touch no-scrollbar">
          {/* Autopilot Feed */}
          <AutopilotFeed />

          {isReportLoading ? (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <span className="absolute inset-0 rounded-full border-4 border-accent-secondary/20 border-t-accent-secondary animate-spin" />
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="font-bold text-text-primary">DicatetinAja AI Sedang Berpikir...</h3>
                <p className="text-xs text-text-tertiary mt-1 animate-pulse">Membaca transaksi, anggaran & kewajibanmu...</p>
              </div>
            </div>
          ) : !report ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-5">
              <div className="relative w-24 h-24 flex items-center justify-center rounded-full bg-gradient-to-br from-[#6366F1] via-[#A855F7] to-[#EC4899] shadow-ai-glow">
                <Sparkle size={48} weight="fill" className="text-text-on-accent relative z-10" />
                <div className="absolute inset-0 rounded-full bg-white/20 blur-md" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary">Intelligence Center</h3>
                <p className="text-xs text-text-tertiary max-w-[260px] mx-auto leading-relaxed mt-2">
                  Dapatkan skor kesehatan keuangan, ulasan posisi dana, grafik, serta rekomendasi hemat cerdas dari DicatetinAja AI.
                </p>
              </div>
              <button
                onClick={generateReport}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-br from-[#6366F1] via-[#A855F7] to-[#EC4899] text-text-on-accent text-sm font-bold active:scale-95 transition-all shadow-ai-glow flex items-center gap-2 mt-2"
              >
                <Sparkle size={18} weight="fill" /> Mulai Analisis Keuangan
              </button>
            </div>
          ) : (
            <>
              {/* Health Score Ring Card */}
              <motion.div
                className="rounded-[28px] glass shadow-elevated p-6 border border-border-light text-center relative overflow-hidden flex flex-col items-center"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <div className="flex justify-between items-center w-full mb-4">
                  <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Skor Finansial AI</span>
                  <span className="text-[10px] text-text-tertiary font-medium bg-bg-secondary px-2 py-1 rounded-md">
                    Diperbarui: {formatDate(report.lastGeneratedAt)}
                  </span>
                </div>

                <div className="relative my-3 drop-shadow-lg">
                  <ProgressRing
                    percentage={report.healthScore}
                    size={140}
                    strokeWidth={12}
                    color={report.healthScore >= 75 ? "url(#aiGradient)" : report.healthScore >= 50 ? "#FBBF24" : "var(--accent-danger)"}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-4xl font-extrabold text-text-primary tabular-nums leading-none tracking-tighter">
                        {report.healthScore}
                      </span>
                    </div>
                  </ProgressRing>
                  <svg style={{ height: 0, width: 0, position: 'absolute' }}>
                    <defs>
                      <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--ai-gradient-start)" />
                        <stop offset="50%" stopColor="var(--ai-gradient-mid)" />
                        <stop offset="100%" stopColor="var(--ai-gradient-end)" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <h3 className="text-lg font-bold text-text-primary mt-4">
                  {report.healthScore >= 80 ? 'Sangat Sehat 🎉' : report.healthScore >= 60 ? 'Cukup Aman 👍' : 'Perlu Waspada ⚠️'}
                </h3>
                <p className="text-xs text-text-secondary mt-2 leading-relaxed max-w-[320px] mx-auto font-medium">
                  {report.summary}
                </p>
              </motion.div>

              {/* Financial Position Breakdown */}
              <div className="rounded-[20px] bg-bg-elevated shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 border border-border-light space-y-4">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <Heart size={18} className="text-accent-danger" weight="fill" />
                  Posisi Keuangan (Net Worth)
                </h3>
                
                {/* Horizontal progress stack bar */}
                <div className="space-y-3">
                  {(() => {
                    const totalBalance = getTotalBalance();
                    const totalReceivables = useReceivableStore.getState().getTotalReceivable();
                    const totalDebts = useDebtStore.getState().getTotalDebt();
                    const netWorth = totalBalance + totalReceivables - totalDebts;
                    const totalAssets = totalBalance + totalReceivables;
                    const assetWidthPct = totalAssets + totalDebts > 0 ? (totalAssets / (totalAssets + totalDebts)) * 100 : 50;
                    const debtWidthPct = totalAssets + totalDebts > 0 ? (totalDebts / (totalAssets + totalDebts)) * 100 : 50;

                    return (
                      <>
                        <div className="h-4 rounded-full bg-bg-secondary overflow-hidden flex">
                          <div
                            style={{ width: `${assetWidthPct}%` }}
                            className="bg-accent-primary h-full transition-all duration-500"
                            title="Aset"
                          />
                          <div
                            style={{ width: `${debtWidthPct}%` }}
                            className="bg-accent-danger h-full transition-all duration-500"
                            title="Kewajiban"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="p-3 bg-bg-secondary rounded-xl">
                            <span className="text-[10px] text-text-tertiary uppercase font-semibold">Total Aset (Uang & Piutang)</span>
                            <span className="text-sm font-bold text-accent-primary tabular-nums block mt-0.5">
                              {formatCurrency(totalAssets)}
                            </span>
                          </div>
                          <div className="p-3 bg-bg-secondary rounded-xl">
                            <span className="text-[10px] text-text-tertiary uppercase font-semibold">Total Kewajiban (Hutang)</span>
                            <span className="text-sm font-bold text-accent-danger tabular-nums block mt-0.5">
                              {formatCurrency(totalDebts)}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center bg-accent-secondary/5 border border-accent-secondary/15 rounded-xl p-3">
                          <span className="text-xs text-text-secondary font-semibold">Kekayaan Bersih (Net Worth)</span>
                          <span className="text-base font-extrabold text-accent-secondary tabular-nums">
                            {formatCurrency(netWorth)}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Income vs Expense Chart */}
              <div className="rounded-[20px] bg-bg-elevated shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 border border-border-light space-y-4">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <TrendUp size={18} className="text-accent-primary" weight="bold" />
                  Rasio Bulanan
                </h3>

                {(() => {
                  const { start, end } = getCurrentMonthRange();
                  const monthlyIncome = getTotalByType('income', start, end);
                  const monthlyExpense = getTotalByType('expense', start, end);
                  const incomeWidthPct = monthlyIncome + monthlyExpense > 0 ? (monthlyIncome / (monthlyIncome + monthlyExpense)) * 100 : 50;
                  const expenseWidthPct = monthlyIncome + monthlyExpense > 0 ? (monthlyExpense / (monthlyIncome + monthlyExpense)) * 100 : 50;

                  return (
                    <div className="space-y-3">
                      <div className="h-6 rounded-full bg-bg-secondary overflow-hidden flex">
                        {monthlyIncome > 0 && (
                          <div
                            style={{ width: `${incomeWidthPct}%` }}
                            className="bg-gradient-to-r from-accent-primary to-[#10B981] h-full flex items-center justify-center text-[10px] font-bold text-text-on-accent transition-all duration-500"
                          >
                            {Math.round(incomeWidthPct)}%
                          </div>
                        )}
                        {monthlyExpense > 0 && (
                          <div
                            style={{ width: `${expenseWidthPct}%` }}
                            className="bg-gradient-to-r from-accent-danger to-[#EF4444] h-full flex items-center justify-center text-[10px] font-bold text-text-on-accent transition-all duration-500"
                          >
                            {Math.round(expenseWidthPct)}%
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between text-xs pt-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-accent-primary" />
                          <span className="text-text-secondary">Pemasukan: <strong className="text-text-primary tabular-nums">{formatCurrency(monthlyIncome)}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-accent-danger" />
                          <span className="text-text-secondary">Pengeluaran: <strong className="text-text-primary tabular-nums">{formatCurrency(monthlyExpense)}</strong></span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Category Budgets visual chart */}
              <div className="rounded-[20px] bg-bg-elevated shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 border border-border-light space-y-4">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <Target size={18} className="text-accent-secondary" weight="fill" />
                  Limit Belanja Per Kategori
                </h3>

                {(() => {
                  const { start, end } = getCurrentMonthRange();
                  const categoryTotals = getCategoryTotals(start, end, 'expense');

                  const activeBudgets = budgets.filter((b) => b.amount > 0);

                  return activeBudgets.length === 0 ? (
                    <p className="text-xs text-text-tertiary text-center py-4">Belum ada budget kategori yang diatur.</p>
                  ) : (
                    <div className="space-y-4">
                      {activeBudgets.map(({ categoryId, amount: limit }) => {
                        const cat = categories.find((c) => c.id === categoryId);
                        if (!cat) return null;
                        
                        const actual = categoryTotals.find((ct) => ct.categoryId === categoryId)?.amount || 0;
                        const pct = Math.min(100, Math.round((actual / limit) * 100));
                        const isOver = actual > limit;

                        return (
                          <div key={categoryId} className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="font-semibold text-text-secondary flex items-center gap-1">
                                <DynamicIcon name={cat.icon} size={13} style={{ color: cat.color }} />
                                {cat.name}
                              </span>
                              <span className="text-text-tertiary font-medium tabular-nums">
                                {formatCurrency(actual)} / {formatCurrency(limit)}
                              </span>
                            </div>
                            <div className="h-2.5 w-full bg-bg-secondary rounded-full overflow-hidden">
                              <div
                                style={{ width: `${pct}%` }}
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isOver ? 'bg-accent-danger' : pct > 80 ? 'bg-yellow-500' : 'bg-accent-primary'
                                }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Status breakdown cards */}
              <div className="grid grid-cols-1 gap-3">
                {(report.breakdown || []).map((b, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-bg-elevated border border-border-light flex items-start gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                    <div className="mt-0.5">
                      {b.status === 'good' ? (
                        <CheckCircle size={18} weight="fill" className="text-accent-primary" />
                      ) : b.status === 'warning' ? (
                        <WarningCircle size={18} weight="fill" className="text-accent-danger animate-pulse" />
                      ) : (
                        <Info size={18} weight="fill" className="text-text-tertiary" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-text-primary">{b.title}</h4>
                      <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Recommendations */}
              <div className="rounded-[20px] bg-bg-elevated shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 border border-border-light space-y-3">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <Lightbulb size={18} className="text-accent-primary" weight="fill" />
                  Rekomendasi Hemat AI
                </h3>
                <ul className="space-y-3">
                  {(report.recommendations || []).map((rec, idx) => (
                    <li key={idx} className="flex gap-2.5 text-xs text-text-secondary items-start">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-primary/10 text-accent-primary flex items-center justify-center font-bold text-[10px] mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="leading-relaxed mt-0.5">{rec}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Disclaimer */}
              <p className="text-text-tertiary text-center leading-normal pt-4 text-[10px]">
                💡 DicatetinAja AI memberi analisis berdasarkan riwayat keuangan Anda. Ini bukan nasihat keuangan profesional.
              </p>
            </>
          )}
        </div>
      ) : (
        // ============================================
        // CHAT BOT VIEW
        // ============================================
        <>
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
                    className={`max-w-[85%] rounded-[20px] px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-gradient-to-br from-[#6366F1] via-[#A855F7] to-[#EC4899] text-text-on-accent rounded-br-[4px]'
                        : 'bg-bg-elevated text-text-primary rounded-bl-[4px] border border-border-light'
                    }`}
                  >
                    {!isUser && <span className="text-xs text-text-tertiary block mb-1">DicatetinAja AI</span>}
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
                placeholder="Tanya DicatetinAja AI..."
                disabled={isLoading}
                className="flex-1 bg-bg-elevated border border-border-light rounded-2xl px-4 py-3.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none shadow-sm focus:border-accent-secondary transition-colors"
              />
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isLoading}
                className={`w-[48px] h-[48px] rounded-2xl flex items-center justify-center text-text-on-accent active:scale-95 transition-all shadow-md ${
                  input.trim() && !isLoading
                    ? 'bg-gradient-to-br from-[#6366F1] via-[#A855F7] to-[#EC4899] shadow-ai-glow'
                    : 'bg-text-tertiary/30 cursor-not-allowed shadow-none'
                }`}
              >
                <PaperPlaneTilt size={20} weight="fill" />
              </button>
            </div>

            {/* Disclaimer */}
            <p className="text-text-tertiary text-center mt-3 leading-normal text-[10px]">
              💡 DicatetinAja AI memberi saran berdasarkan catatanmu. Ini bukan nasihat keuangan profesional.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

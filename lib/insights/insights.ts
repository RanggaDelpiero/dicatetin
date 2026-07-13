// ============================================
// Pundi — Financial Insights Engine
// ============================================

import { Transaction, Debt } from '@/lib/types';
import { RecurringTransaction } from '@/lib/stores/recurring-store';

export interface Insight {
  id: string;
  type: 'biggest_jump' | 'unusual_spend' | 'burn_rate' | 'safe_to_spend' | 'upcoming';
  title: string;
  body: string;
  emoji: string;
  gradient: string;
}

interface CategoryBudget {
  categoryId: string;
  amount: number;
}

/**
 * Get the category with the biggest spending increase vs last month
 */
export function getBiggestCategoryJump(
  transactions: Transaction[],
  categories: { id: string; name: string }[],
  currentMonthStart: string,
  currentMonthEnd: string,
  prevMonthStart: string,
  prevMonthEnd: string,
): Insight | null {
  const getCategoryTotals = (txs: Transaction[]) => {
    const totals: Record<string, number> = {};
    txs.filter((t) => t.type === 'expense').forEach((t) => {
      totals[t.category_id] = (totals[t.category_id] || 0) + t.amount;
    });
    return totals;
  };

  const currTxs = transactions.filter((t) => {
    const d = t.date.split('T')[0];
    return d >= currentMonthStart && d <= currentMonthEnd;
  });
  const prevTxs = transactions.filter((t) => {
    const d = t.date.split('T')[0];
    return d >= prevMonthStart && d <= prevMonthEnd;
  });

  const currTotals = getCategoryTotals(currTxs);
  const prevTotals = getCategoryTotals(prevTxs);

  let maxJump = 0;
  let jumpCatId = '';

  Object.keys(currTotals).forEach((catId) => {
    const prev = prevTotals[catId] || 0;
    const curr = currTotals[catId];
    const jump = prev > 0 ? ((curr - prev) / prev) * 100 : curr > 0 ? 100 : 0;
    if (jump > maxJump && jump > 20) {
      maxJump = jump;
      jumpCatId = catId;
    }
  });

  if (!jumpCatId) return null;

  const catName = categories.find((c) => c.id === jumpCatId)?.name || 'Kategori';
  return {
    id: 'biggest_jump',
    type: 'biggest_jump',
    title: 'Lonjakan Pengeluaran 📈',
    body: `${catName} naik ${Math.round(maxJump)}% dari bulan lalu. Cek lagi yuk!`,
    emoji: '📈',
    gradient: 'from-orange-500/15 to-red-500/15',
  };
}

/**
 * Find unusually large transactions (> 2x average for their category)
 */
export function getUnusualSpend(
  transactions: Transaction[],
  categories: { id: string; name: string }[],
  currentMonthStart: string,
  currentMonthEnd: string,
): Insight | null {
  const expenses = transactions.filter(
    (t) => t.type === 'expense' && t.date.split('T')[0] >= currentMonthStart && t.date.split('T')[0] <= currentMonthEnd
  );

  // Category averages
  const catAmounts: Record<string, number[]> = {};
  expenses.forEach((t) => {
    if (!catAmounts[t.category_id]) catAmounts[t.category_id] = [];
    catAmounts[t.category_id].push(t.amount);
  });

  let maxRatio = 0;
  let unusualTx: Transaction | null = null;

  Object.entries(catAmounts).forEach(([catId, amounts]) => {
    if (amounts.length < 2) return;
    const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    amounts.forEach((amount) => {
      const ratio = amount / avg;
      if (ratio > maxRatio && ratio > 2) {
        maxRatio = ratio;
        unusualTx = expenses.find((t) => t.category_id === catId && t.amount === amount) || null;
      }
    });
  });

  if (!unusualTx) return null;
  const tx = unusualTx as Transaction;

  const catName = categories.find((c) => c.id === tx.category_id)?.name || '';
  return {
    id: 'unusual_spend',
    type: 'unusual_spend',
    title: 'Pengeluaran Gak Biasa 🚨',
    body: `${tx.note || catName}: Rp${tx.amount.toLocaleString('id-ID')} — ${Math.round(maxRatio)}x lebih besar dari rata-rata.`,
    emoji: '🚨',
    gradient: 'from-red-500/15 to-pink-500/15',
  };
}

/**
 * Calculate budget burn rate — at current pace, when will budget run out?
 */
export function getBudgetBurnRate(
  budgets: CategoryBudget[],
  transactions: Transaction[],
  today: Date,
): Insight | null {
  if (budgets.length === 0) return null;

  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  const monthEnd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = transactions
    .filter((t) => {
      const d = t.date.split('T')[0];
      return t.type === 'expense' && d >= monthStart && d <= monthEnd &&
        budgets.some((b) => b.categoryId === t.category_id);
    })
    .reduce((s, t) => s + t.amount, 0);

  if (totalBudget === 0 || dayOfMonth === 0) return null;

  const dailyRate = totalSpent / dayOfMonth;
  const projectedTotal = dailyRate * daysInMonth;
  const burnPct = Math.round((projectedTotal / totalBudget) * 100);

  if (burnPct < 80) {
    return {
      id: 'burn_rate',
      type: 'burn_rate',
      title: 'Laju Pengeluaran Aman 💚',
      body: `Kalau lanjut di pace ini, kamu cuma pakai ${burnPct}% budget bulan ini. Mantap!`,
      emoji: '💚',
      gradient: 'from-green-500/15 to-emerald-500/15',
    };
  }

  return {
    id: 'burn_rate',
    type: 'burn_rate',
    title: 'Budget Burn Rate 🔥',
    body: `Proyeksi: ${burnPct}% budget habis bulan ini. ${burnPct > 100 ? 'Rem dikit ya!' : 'Hati-hati pace-nya.'}`,
    emoji: '🔥',
    gradient: 'from-orange-500/15 to-amber-500/15',
  };
}

/**
 * Safe to spend today — remaining daily budget minus committed recurring
 */
export function getSafeToSpendToday(
  budgets: CategoryBudget[],
  transactions: Transaction[],
  recurring: RecurringTransaction[],
  today: Date,
): Insight | null {
  if (budgets.length === 0) return null;

  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const todayStr = today.toISOString().split('T')[0];

  const totalDailyBudget = budgets.reduce((s, b) => s + Math.round(b.amount / daysInMonth), 0);

  const todaySpent = transactions
    .filter((t) => t.type === 'expense' && t.date.split('T')[0] === todayStr)
    .reduce((s, t) => s + t.amount, 0);

  // Subtract any recurring transactions due today that haven't fired yet
  const recurringToday = recurring
    .filter((r) => r.status === 'active' && r.next_due_date === todayStr && r.type === 'expense')
    .reduce((s, r) => s + r.amount, 0);

  const safeToSpend = totalDailyBudget - todaySpent - recurringToday;

  return {
    id: 'safe_to_spend',
    type: 'safe_to_spend',
    title: safeToSpend >= 0 ? 'Aman Belanja Hari Ini 💰' : 'Udah Boncos Hari Ini 😅',
    body: safeToSpend >= 0
      ? `Masih bisa keluarin Rp${safeToSpend.toLocaleString('id-ID')} hari ini tanpa over budget.`
      : `Udah lebih Rp${Math.abs(safeToSpend).toLocaleString('id-ID')} dari budget harian. Rem dulu ya!`,
    emoji: safeToSpend >= 0 ? '💰' : '😅',
    gradient: safeToSpend >= 0 ? 'from-emerald-500/15 to-teal-500/15' : 'from-red-500/15 to-rose-500/15',
  };
}

/**
 * Upcoming obligations in the next 7 days
 */
export function getUpcomingObligations(
  debts: Debt[],
  recurring: RecurringTransaction[],
  today: Date,
): Insight | null {
  const upcoming: string[] = [];
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];

  debts
    .filter((d) => d.status === 'active' && d.due_date)
    .forEach((d) => {
      if (d.due_date! >= todayStr && d.due_date! <= nextWeekStr) {
        upcoming.push(`${d.creditor} (Rp${d.remaining_amount.toLocaleString('id-ID')})`);
      }
    });

  recurring
    .filter((r) => r.status === 'active')
    .forEach((r) => {
      if (r.next_due_date >= todayStr && r.next_due_date <= nextWeekStr) {
        upcoming.push(`${r.name} (Rp${r.amount.toLocaleString('id-ID')})`);
      }
    });

  if (upcoming.length === 0) return null;

  return {
    id: 'upcoming',
    type: 'upcoming',
    title: `${upcoming.length} Kewajiban Minggu Ini 📅`,
    body: upcoming.slice(0, 3).join(', ') + (upcoming.length > 3 ? ` +${upcoming.length - 3} lagi` : ''),
    emoji: '📅',
    gradient: 'from-blue-500/15 to-indigo-500/15',
  };
}

/**
 * Generate all available insights
 */
export function generateInsights(
  transactions: Transaction[],
  categories: { id: string; name: string }[],
  budgets: CategoryBudget[],
  debts: Debt[],
  recurring: RecurringTransaction[],
  today: Date,
): Insight[] {
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const currStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const currEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevDaysInMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
  const prevStart = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-01`;
  const prevEnd = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(prevDaysInMonth).padStart(2, '0')}`;

  const insights: Insight[] = [];

  const safeToSpend = getSafeToSpendToday(budgets, transactions, recurring, today);
  if (safeToSpend) insights.push(safeToSpend);

  const biggestJump = getBiggestCategoryJump(transactions, categories, currStart, currEnd, prevStart, prevEnd);
  if (biggestJump) insights.push(biggestJump);

  const unusualSpend = getUnusualSpend(transactions, categories, currStart, currEnd);
  if (unusualSpend) insights.push(unusualSpend);

  const burnRate = getBudgetBurnRate(budgets, transactions, today);
  if (burnRate) insights.push(burnRate);

  const upcoming = getUpcomingObligations(debts, recurring, today);
  if (upcoming) insights.push(upcoming);

  return insights;
}

// ============================================
// Pundi — Anomaly Detection
// ============================================

export interface TransactionInput {
  id: string;
  category_id: string;
  amount: number;
  date: string;
  type: string;
}

export interface Anomaly {
  transactionId: string;
  type: 'high_expense' | 'duplicate';
  expectedAmount?: number;
  actualAmount: number;
  reason: string;
}

/**
 * Detects anomalous transactions in the current period based on historical data.
 */
export function detectAnomalies(
  currentTransactions: TransactionInput[],
  historicalTransactions: TransactionInput[]
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  const currentExpenses = currentTransactions.filter(t => t.type === 'expense');
  const historicalExpenses = historicalTransactions.filter(t => t.type === 'expense');

  if (currentExpenses.length === 0 || historicalExpenses.length === 0) {
    return [];
  }

  // 1. Unusually High Expenses based on Category Mean + StdDev
  // Group historical by category
  const historyByCat = new Map<string, number[]>();
  for (const t of historicalExpenses) {
    const arr = historyByCat.get(t.category_id) || [];
    arr.push(t.amount);
    historyByCat.set(t.category_id, arr);
  }

  // Calculate stats per category
  const statsByCat = new Map<string, { mean: number; stdDev: number; max: number; count: number }>();
  for (const [catId, amounts] of historyByCat.entries()) {
    if (amounts.length < 2) continue; // Not enough data for stats

    const sum = amounts.reduce((a, b) => a + b, 0);
    const mean = sum / amounts.length;
    
    const variance = amounts.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const max = Math.max(...amounts);

    statsByCat.set(catId, { mean, stdDev, max, count: amounts.length });
  }

  // Check current transactions against stats
  for (const t of currentExpenses) {
    const stats = statsByCat.get(t.category_id);
    if (!stats) continue;

    // Minimum threshold for an anomaly (e.g. 100k IDR), ignore very small anomalies like 5000 vs 2000
    if (t.amount < 50000) continue;

    // Anomaly condition: greater than mean + 3*stdDev AND > 150% of historical max
    // or just simply > mean + 2.5 * stdDev and amount > mean * 2
    const threshold = stats.mean + (3 * stats.stdDev);
    const isStatisticallyHigh = t.amount > threshold && t.amount > stats.mean * 2;
    const isHistoricallyHigh = t.amount > stats.max * 1.5;

    if (isStatisticallyHigh || (stats.count >= 3 && isHistoricallyHigh)) {
      anomalies.push({
        transactionId: t.id,
        type: 'high_expense',
        expectedAmount: stats.mean,
        actualAmount: t.amount,
        reason: `Pengeluaran ini jauh lebih tinggi dari kebiasaanmu (rata-rata Rp${stats.mean.toLocaleString('id-ID')}).`,
      });
    }
  }

  // 2. Duplicate Transactions (same exact amount, same category, very close in time)
  // To be implemented or handled if needed. Currently focusing on high_expense.

  return anomalies;
}

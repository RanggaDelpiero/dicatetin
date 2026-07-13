// ============================================
// Pundi — Recurring Transaction Detector
// ============================================

export interface TransactionInput {
  id: string;
  note?: string;
  amount: number;
  date: string;
  type: string;
}

export interface DetectedRecurring {
  name: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  confidence: number;
  nextDueDate: string;
  transactionIds: string[];
}

/**
 * Normalizes a note for comparison:
 * - Lowercase
 * - Removes common noise words (tagihan, bayar, bulan, dsb)
 * - Removes numbers (often used for dates/months)
 * - Removes special characters
 */
function normalizeNote(note: string): string {
  if (!note) return '';
  return note
    .toLowerCase()
    .replace(/(tagihan|bayar|bulan|jan|feb|mar|apr|mei|jun|jul|aug|sep|okt|nov|des|20\d\d|\d+)/g, ' ')
    .replace(/[^a-z ]/g, ' ')
    .trim();
}

/**
 * Helper to compute Jaro-Winkler or simple substring similarity.
 * We'll use a simpler substring containment / exact match for now.
 */
function isSimilarNote(a: string, b: string): boolean {
  const normA = normalizeNote(a);
  const normB = normalizeNote(b);
  if (!normA || !normB) return false;
  
  // If one is very short, require exact match without spaces
  const noSpaceA = normA.replace(/\s/g, '');
  const noSpaceB = normB.replace(/\s/g, '');
  if (noSpaceA.length < 3 || noSpaceB.length < 3) {
    return noSpaceA === noSpaceB;
  }
  
  // Token intersection
  const tokensA = normA.split(/\s+/).filter(t => t.length >= 3);
  const tokensB = normB.split(/\s+/).filter(t => t.length >= 3);

  // If they share at least one meaningful token
  for (const tA of tokensA) {
    for (const tB of tokensB) {
      if (tA === tB || tA.includes(tB) || tB.includes(tA)) {
        return true;
      }
    }
  }

  return noSpaceA.includes(noSpaceB) || noSpaceB.includes(noSpaceA);
}

/**
 * Detects recurring transactions from a list of transactions.
 * Rules:
 * - At least 3 occurrences
 * - Same amount (exact match for now, or very close)
 * - Similar notes
 * - Consistent intervals (~7 days for weekly, ~30 days for monthly)
 */
export function detectRecurringTransactions(transactions: TransactionInput[]): DetectedRecurring[] {
  const expenses = transactions
    .filter(t => t.type === 'expense' && t.note && t.amount > 0)
    // Sort chronologically ascending
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (expenses.length < 3) return [];

  // Cluster by exact amount first to reduce complexity
  const clustersByAmount = new Map<number, TransactionInput[]>();
  
  for (const tx of expenses) {
    const arr = clustersByAmount.get(tx.amount) || [];
    arr.push(tx);
    clustersByAmount.set(tx.amount, arr);
  }

  const detected: DetectedRecurring[] = [];

  for (const [amount, txs] of clustersByAmount.entries()) {
    if (txs.length < 3) continue;

    // Sub-cluster by note similarity
    const noteClusters: TransactionInput[][] = [];
    
    for (const tx of txs) {
      let matched = false;
      for (const cluster of noteClusters) {
        // Compare with the first item in the cluster
        if (isSimilarNote(tx.note!, cluster[0].note!)) {
          cluster.push(tx);
          matched = true;
          break;
        }
      }
      if (!matched) {
        noteClusters.push([tx]);
      }
    }

    // Evaluate each note cluster
    for (const cluster of noteClusters) {
      if (cluster.length < 3) continue;

      // Calculate intervals
      const intervals: number[] = [];
      for (let i = 1; i < cluster.length; i++) {
        const d1 = new Date(cluster[i-1].date).getTime();
        const d2 = new Date(cluster[i].date).getTime();
        const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
        intervals.push(diffDays);
      }

      // Check consistency of intervals
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      
      let frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | null = null;
      let isConsistent = true;

      // Allow some deviation (e.g. weekends, 28 vs 31 days)
      if (avgInterval >= 27 && avgInterval <= 33) {
        frequency = 'monthly';
        // Verify all intervals are roughly monthly
        if (!intervals.every(i => i >= 25 && i <= 35)) isConsistent = false;
      } else if (avgInterval >= 6 && avgInterval <= 8) {
        frequency = 'weekly';
        if (!intervals.every(i => i >= 5 && i <= 9)) isConsistent = false;
      } else if (avgInterval === 1) {
        frequency = 'daily';
      }

      if (frequency && isConsistent) {
        // Compute next due date from the last occurrence
        const lastOccurence = new Date(cluster[cluster.length - 1].date);
        if (frequency === 'monthly') {
          // Add 1 month
          lastOccurence.setMonth(lastOccurence.getMonth() + 1);
        } else if (frequency === 'weekly') {
          lastOccurence.setDate(lastOccurence.getDate() + 7);
        } else if (frequency === 'daily') {
          lastOccurence.setDate(lastOccurence.getDate() + 1);
        }

        const nextDueDate = lastOccurence.toISOString().split('T')[0];

        // Clean up the name for the user
        let name = cluster[cluster.length - 1].note!.trim();
        // Capitalize nicely
        if (name) {
          name = name.charAt(0).toUpperCase() + name.slice(1);
        }

        detected.push({
          name,
          amount,
          frequency,
          confidence: 0.9, // high confidence due to exact amount + 3 occurrences + consistent interval
          nextDueDate,
          transactionIds: cluster.map(c => c.id),
        });
      }
    }
  }

  return detected;
}

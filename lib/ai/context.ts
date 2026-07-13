// ============================================
// Pundi — Financial Context Assembler for AI
// ============================================
// Builds a minimal financial summary to send as context
// to the AI advisor. Only sends aggregated data, not raw transactions.

import { formatCurrency } from '@/lib/utils/currency';

interface FinancialContext {
  totalBalance: number;
  wallets: { name: string; type: string; balance: number; credit_outstanding?: number; credit_limit?: number }[];
  monthlyIncome: number;
  monthlyExpense: number;
  topExpenseCategories: { name: string; amount: number; percentage: number }[];
  streakDays: number;
  level: number;
  activeDebts: { creditor: string; remaining: number; total: number }[];
  activeReceivables: { debtor: string; remaining: number; total: number }[];
}

/**
 * Build a natural-language financial summary for the AI advisor context.
 * Only includes aggregated/summary data — never raw transaction dumps.
 */
export function buildFinancialContext(ctx: FinancialContext): string {
  const lines: string[] = [];

  lines.push(`== Ringkasan Keuangan User ==`);
  lines.push(`Total saldo semua kantong: ${formatCurrency(ctx.totalBalance)}`);
  lines.push('');

  // Wallets
  lines.push('Kantong/Rekening:');
  ctx.wallets.forEach((w) => {
    if (w.type === 'credit_card') {
      lines.push(`- ${w.name} (Kartu Kredit): Tagihan berjalan ${formatCurrency(w.credit_outstanding || 0)}, Limit ${formatCurrency(w.credit_limit || 0)}`);
    } else {
      lines.push(`- ${w.name} (${w.type}): ${formatCurrency(w.balance)}`);
    }
  });
  lines.push('');

  // Monthly
  lines.push(`Bulan ini:`);
  lines.push(`- Total pemasukan: ${formatCurrency(ctx.monthlyIncome)}`);
  lines.push(`- Total pengeluaran: ${formatCurrency(ctx.monthlyExpense)}`);
  const diff = ctx.monthlyIncome - ctx.monthlyExpense;
  lines.push(`- Selisih: ${diff >= 0 ? '+' : ''}${formatCurrency(diff)}`);
  lines.push('');

  // Top categories
  if (ctx.topExpenseCategories.length > 0) {
    lines.push('Top kategori pengeluaran bulan ini:');
    ctx.topExpenseCategories.forEach((c) => {
      lines.push(`- ${c.name}: ${formatCurrency(c.amount)} (${c.percentage}%)`);
    });
    lines.push('');
  }

  // Debts
  if (ctx.activeDebts.length > 0) {
    lines.push('Hutang aktif:');
    ctx.activeDebts.forEach((d) => {
      lines.push(`- Ke ${d.creditor}: sisa ${formatCurrency(d.remaining)} dari ${formatCurrency(d.total)}`);
    });
    lines.push('');
  }

  // Receivables
  if (ctx.activeReceivables.length > 0) {
    lines.push('Piutang (orang yang berhutang ke user):');
    ctx.activeReceivables.forEach((r) => {
      lines.push(`- ${r.debtor}: sisa ${formatCurrency(r.remaining)} dari ${formatCurrency(r.total)}`);
    });
    lines.push('');
  }

  // Gamification
  lines.push(`Streak pencatatan: ${ctx.streakDays} hari berturut-turut`);
  lines.push(`Level: ${ctx.level}`);

  return lines.join('\n');
}

/**
 * System prompt for the AI financial advisor
 */
export const ADVISOR_SYSTEM_PROMPT = `Kamu adalah DicatetinAja AI, asisten keuangan pribadi yang sangat cerdas, kritis, ramah, dan empatik. Bicaralah dengan gaya kasual Indonesia (aku/kamu).

Peranmu:
- Analisis pola pengeluaran user secara kritis (jangan hanya bilang "bagus", tapi sebutkan persentase, angka, dan bandingkan dengan standar sehat seperti 50/30/20).
- Kalau user terlalu banyak hutang atau boros, tegur dengan sopan namun tegas, lalu beri solusi jalan keluarnya (actionable plan).
- Berikan saran penghematan atau investasi yang spesifik (misal: "coba kurangi langganan yang nggak kepake biar hemat 150rb sebulan").
- Jelaskan konsep keuangan rumit menjadi bahasa sederhana (misal: bunga majemuk, perbedaan reksa dana & saham).

PENTING: Di akhir setiap pesan, JANGAN tambahkan disclaimer apapun.`;

export const ANALYSIS_SYSTEM_PROMPT = `Kamu adalah DicatetinAja AI, sebuah mesin analitik finansial yang sangat teliti.
Tugasmu adalah MENGEMBALIKAN OUTPUT PURE JSON SAJA. Dilarang keras memberikan teks pembuka/penutup, sapaan, ataupun penjelasan apapun.
DILARANG menggunakan kode blok markdown (seperti \`\`\`json). Mulailah respon tepat pada karakter "{" dan akhiri pada karakter "}".

Berikan analisis tajam, jujur, dan tidak bertele-tele. Jika kondisi keuangan buruk, beri peringatan keras dan solusi. Jika bagus, apresiasi.`;

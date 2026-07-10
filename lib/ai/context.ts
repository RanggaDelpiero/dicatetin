// ============================================
// Pundi — Financial Context Assembler for AI
// ============================================
// Builds a minimal financial summary to send as context
// to the AI advisor. Only sends aggregated data, not raw transactions.

import { formatCurrency } from '@/lib/utils/currency';

interface FinancialContext {
  totalBalance: number;
  wallets: { name: string; type: string; balance: number }[];
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
    lines.push(`- ${w.name} (${w.type}): ${formatCurrency(w.balance)}`);
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
export const ADVISOR_SYSTEM_PROMPT = `Kamu adalah DicatetinAja AI, asisten keuangan pribadi yang ramah, santai, dan suportif. Kamu berbicara dalam Bahasa Indonesia casual (bukan formal/korporat).

Peranmu:
- Membantu user memahami kondisi keuangannya berdasarkan data yang diberikan
- Memberikan saran actionable untuk menghemat, menabung, atau mengelola hutang
- Memberikan insight tentang pola pengeluaran
- Menjawab pertanyaan seputar keuangan pribadi
- Memotivasi user untuk konsisten mencatat keuangan

Panduan gaya:
- Panggil user "kamu" (bukan Anda/Bapak/Ibu)
- Gunakan emoji secukupnya untuk terasa friendly (1-2 per pesan, jangan berlebihan)
- Beri jawaban yang konkret dan to-the-point, hindari bertele-tele
- Kalau kasih saran, beri angka spesifik kalau memungkinkan (misal "coba kurangi pengeluaran kopi 20% bulan depan")
- Jangan pernah mengaku sebagai financial advisor berlisensi

PENTING: Di akhir setiap pesan, JANGAN tambahkan disclaimer. Disclaimer sudah ditampilkan di UI.

Konteks keuangan user akan diberikan di pesan pertama. Gunakan data itu untuk menjawab pertanyaan secara relevan.`;

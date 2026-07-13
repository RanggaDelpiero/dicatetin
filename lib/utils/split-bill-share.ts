// ============================================
// Pundi — Split Bill Share Generator
// ============================================

import { SplitBillSession } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/currency';

/**
 * Generates a polite, formatted text summary for sharing via WhatsApp or other text apps.
 */
export function generateSplitBillShareText(session: SplitBillSession, bankInfo?: string): string {
  const dateStr = new Date(session.created_at).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  let text = `*Tagihan Split Bill: ${session.title}* 🧾\n`;
  text += `📅 Tanggal: ${dateStr}\n`;
  text += `💰 Total Transaksi: ${formatCurrency(session.total_amount)}\n\n`;

  text += `*Rincian per Orang:*\n`;

  const unpaidParticipants = session.participants.filter(p => p.status !== 'paid');
  const paidParticipants = session.participants.filter(p => p.status === 'paid');

  if (unpaidParticipants.length > 0) {
    unpaidParticipants.forEach((p) => {
      text += `• ${p.name}: ${formatCurrency(p.amount)} (Belum Bayar)\n`;
    });
  }

  if (paidParticipants.length > 0) {
    if (unpaidParticipants.length > 0) text += '\n';
    paidParticipants.forEach((p) => {
      text += `• ~${p.name}: ${formatCurrency(p.amount)}~ (Lunas ✅)\n`;
    });
  }

  text += `\nYuk segera dilunasin yaa! 🙏\n`;

  if (bankInfo) {
    text += `\n*Transfer ke:*\n${bankInfo}\n`;
  }

  text += `\n_Dicatat pakai Pundi 💚_`;

  return text;
}

/**
 * Generates a specific reminder message for a single participant.
 */
export function generateParticipantReminder(participantName: string, amount: number, title: string, bankInfo?: string): string {
  let text = `Halo ${participantName}! 👋\n\n`;
  text += `Cuma mau ngingetin untuk tagihan *${title}* kemarin ya.\n`;
  text += `Sisa tagihan kamu: *${formatCurrency(amount)}*\n\n`;

  if (bankInfo) {
    text += `Bisa ditransfer ke:\n${bankInfo}\n\n`;
  }

  text += `Makasih! 🙏`;

  return text;
}

/**
 * Shares the text using the Web Share API if available, fallback to clipboard.
 */
export async function shareText(text: string, title: string = 'Tagihan Split Bill'): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
      });
      return true;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
      return false;
    }
  } else {
    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(text);
      alert('Teks berhasil disalin ke clipboard! Silakan paste di chat.');
      return true;
    } catch (err) {
      console.error('Error copying text:', err);
      return false;
    }
  }
}

/**
 * Opens WhatsApp directly with pre-filled text.
 */
export function openWhatsApp(text: string) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

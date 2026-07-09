// ============================================
// Pundi — Streak System
// ============================================

/**
 * Calculate if streak is still active based on last activity date
 * Streak breaks if user misses an entire day
 */
export function isStreakActive(lastActivityDate: string): boolean {
  const last = new Date(lastActivityDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  const diffDays = Math.round((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 1;
}

/**
 * Check if user already logged activity today
 */
export function hasLoggedToday(lastActivityDate: string): boolean {
  const last = new Date(lastActivityDate);
  const now = new Date();
  return (
    last.getFullYear() === now.getFullYear() &&
    last.getMonth() === now.getMonth() &&
    last.getDate() === now.getDate()
  );
}

/**
 * Calculate new streak count
 */
export function calculateStreak(currentStreak: number, lastActivityDate: string): number {
  if (!lastActivityDate) return 1;
  if (hasLoggedToday(lastActivityDate)) return currentStreak;
  if (isStreakActive(lastActivityDate)) return currentStreak + 1;
  return 1; // Reset streak
}

/**
 * Get streak color based on length
 * yellow → orange → red (makin panjang makin intens)
 */
export function getStreakColor(days: number): string {
  if (days <= 3) return '#FFC53D';   // gold/yellow
  if (days <= 7) return '#F59E0B';   // amber
  if (days <= 14) return '#F97316';  // orange
  if (days <= 30) return '#EF4444';  // red
  return '#DC2626';                  // deep red
}

/**
 * Get streak message (fun micro-copy)
 */
export function getStreakMessage(days: number): string {
  if (days === 0) return 'Mulai catat hari ini! 🔥';
  if (days === 1) return 'Hari pertama! Keep going! 💪';
  if (days <= 3) return `${days} hari beruntun! 🔥`;
  if (days <= 7) return `${days} hari! Mantap! 🔥🔥`;
  if (days <= 14) return `${days} hari! Keren banget! 🔥🔥🔥`;
  if (days <= 30) return `${days} hari! Unstoppable! 🚀`;
  return `${days} hari! LEGENDARY! 🏆🔥`;
}

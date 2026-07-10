// ============================================
// Pundi — Date Utilities
// ============================================

/**
 * Get today's date as ISO date string (YYYY-MM-DD)
 */
export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Format date for display
 * e.g., "2026-07-09" → "9 Jul 2026"
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format date with day name
 * e.g., "2026-07-09" → "Rabu, 9 Jul 2026"
 */
export function formatDateFull(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format relative date
 * e.g., "Hari ini", "Kemarin", "3 hari lalu"
 */
export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return `${diffDays} hari lalu`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
  return formatDate(dateStr);
}

/**
 * Get the start and end of the current month
 */
export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

/**
 * Get the start and end of the current week (Monday-Sunday)
 */
export function getCurrentWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(now.setDate(diff));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

/**
 * Get month name in Indonesian
 */
export function getMonthName(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}


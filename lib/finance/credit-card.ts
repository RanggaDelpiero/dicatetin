export type CreditCardPaymentStatus = 'safe' | 'due-soon' | 'overdue' | 'no-due-date';

export function getAvailableCredit(limit = 0, outstanding = 0): number {
  return Math.max(0, limit - outstanding);
}

export function getCreditUsagePercentage(limit = 0, outstanding = 0): number {
  if (limit <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((outstanding / limit) * 100)));
}

export function getCreditCardPaymentStatus(
  dueDate?: string,
  today = new Date().toISOString().split('T')[0],
): CreditCardPaymentStatus {
  if (!dueDate) return 'no-due-date';

  const due = new Date(`${dueDate}T00:00:00`);
  const current = new Date(`${today}T00:00:00`);
  const diffDays = Math.ceil((due.getTime() - current.getTime()) / 86_400_000);

  if (diffDays < 0) return 'overdue';
  if (diffDays <= 3) return 'due-soon';
  return 'safe';
}

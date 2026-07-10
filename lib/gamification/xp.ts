// ============================================
// Pundi — XP & Level System
// ============================================

/** XP earned per action */
export const XP_REWARDS = {
  ADD_TRANSACTION: 10,
  ADD_BULK_ENTRY: 5,  // per item in bulk
  COMPLETE_DEBT_PAYMENT: 25,
  SETTLE_RECEIVABLE: 20,
  FIRST_SPLIT_BILL: 30,
  MAINTAIN_STREAK_7: 50,
  MAINTAIN_STREAK_30: 150,
  CUSTOM_CATEGORY: 15,
  VIEW_HIGHLIGHT: 5,
  AI_ADVISOR: 20,
} as const;

/** Level thresholds — XP needed to reach each level */
const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  800,    // Level 5
  1200,   // Level 6
  1700,   // Level 7
  2300,   // Level 8
  3000,   // Level 9
  4000,   // Level 10
  5200,   // Level 11
  6500,   // Level 12
  8000,   // Level 13
  10000,  // Level 14
  12500,  // Level 15
];

/**
 * Calculate level from total XP
 */
export function calculateLevel(totalXP: number): number {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

/**
 * Get XP progress within current level
 * Returns { current, required, percentage }
 */
export function getLevelProgress(totalXP: number): {
  current: number;
  required: number;
  percentage: number;
} {
  const level = calculateLevel(totalXP);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || currentThreshold + 1500;

  const current = totalXP - currentThreshold;
  const required = nextThreshold - currentThreshold;
  const percentage = Math.min(Math.round((current / required) * 100), 100);

  return { current, required, percentage };
}

/**
 * Get fun level title
 */
export function getLevelTitle(level: number): string {
  const titles = [
    'Pemula Keuangan',       // 1
    'Pencatat Rajin',        // 2
    'Penghemat Pemula',      // 3
    'Money Manager',         // 4
    'Budget Master',         // 5
    'Financial Warrior',     // 6
    'Wealth Builder',        // 7
    'Investment Ready',      // 8
    'Money Guru',            // 9
    'Financial Expert',      // 10
    'Economy Boss',          // 11
    'Treasure Hunter',       // 12
    'Golden Saver',          // 13
    'Platinum Planner',      // 14
    'Diamond Legend',        // 15
  ];
  return titles[Math.max(0, Math.min(level - 1, titles.length - 1))];
}

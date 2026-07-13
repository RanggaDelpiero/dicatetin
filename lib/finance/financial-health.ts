// ============================================
// Pundi — Financial Health Calculator
// ============================================

export interface HealthInput {
  totalIncome: number;
  totalExpense: number;
  totalSavings: number; // total liquid balances
  totalDebt: number;
  monthlyDebtPayment: number;
  needsExpense: number;
  wantsExpense: number;
  savingsExpense: number;
}

export interface HealthMetric {
  id: string;
  name: string;
  score: number; // 0-100
  status: 'good' | 'warning' | 'danger';
  value: string;
  recommendation: string;
}

export interface HealthResult {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  metrics: HealthMetric[];
  topImprovement?: string;
}

/**
 * Calculates a comprehensive financial health score (0-100)
 */
export function calculateFinancialHealth(input: HealthInput): HealthResult {
  const metrics: HealthMetric[] = [];
  let totalScore = 0;

  // 1. Emergency Fund Ratio (Weight: 30%)
  // Target: 6 months of expenses
  const monthlyExpense = input.totalExpense > 0 ? input.totalExpense : 1; // avoid division by zero
  const efMonths = input.totalSavings / monthlyExpense;
  let efScore = 0;
  let efStatus: 'good' | 'warning' | 'danger' = 'danger';
  if (efMonths >= 6) {
    efScore = 100;
    efStatus = 'good';
  } else if (efMonths >= 3) {
    efScore = 75;
    efStatus = 'warning';
  } else if (efMonths >= 1) {
    efScore = 40;
    efStatus = 'danger';
  } else {
    efScore = Math.max(0, (efMonths / 1) * 30);
  }
  
  metrics.push({
    id: 'emergency_fund',
    name: 'Dana Darurat',
    score: efScore,
    status: efStatus,
    value: `${efMonths.toFixed(1)} bulan pengeluaran`,
    recommendation: efStatus === 'good' ? 'Dana darurat sangat aman (≥ 6 bulan).' : 'Kumpulkan dana darurat minimal 3-6 bulan pengeluaran.',
  });

  // 2. Debt-to-Income Ratio (DTI) (Weight: 30%)
  // Target: < 30%
  const income = input.totalIncome > 0 ? input.totalIncome : 1;
  const dtiPct = (input.monthlyDebtPayment / income) * 100;
  let dtiScore = 0;
  let dtiStatus: 'good' | 'warning' | 'danger' = 'danger';

  if (input.monthlyDebtPayment === 0 && input.totalDebt === 0) {
    dtiScore = 100;
    dtiStatus = 'good';
  } else if (dtiPct <= 30) {
    dtiScore = 100 - (dtiPct / 30) * 10; // 90-100
    dtiStatus = 'good';
  } else if (dtiPct <= 40) {
    dtiScore = 70;
    dtiStatus = 'warning';
  } else {
    dtiScore = Math.max(0, 100 - dtiPct);
  }

  metrics.push({
    id: 'dti',
    name: 'Rasio Cicilan',
    score: dtiScore,
    status: dtiStatus,
    value: `${dtiPct.toFixed(1)}% dari pemasukan`,
    recommendation: dtiStatus === 'good' ? 'Beban cicilan aman (< 30%).' : 'Beban cicilan terlalu tinggi. Hindari tambah hutang baru.',
  });

  // 3. Saving Rate (Weight: 20%)
  // Target: >= 20%
  const savingRatePct = input.totalIncome > 0 ? ((input.totalIncome - input.totalExpense) / input.totalIncome) * 100 : 0;
  let srScore = 0;
  let srStatus: 'good' | 'warning' | 'danger' = 'danger';

  if (savingRatePct >= 20) {
    srScore = 100;
    srStatus = 'good';
  } else if (savingRatePct >= 10) {
    srScore = 70;
    srStatus = 'warning';
  } else if (savingRatePct > 0) {
    srScore = 40;
    srStatus = 'danger';
  } else {
    srScore = 0;
  }

  metrics.push({
    id: 'saving_rate',
    name: 'Rasio Tabungan',
    score: srScore,
    status: srStatus,
    value: `${savingRatePct.toFixed(1)}% ditabung`,
    recommendation: srStatus === 'good' ? 'Mantap, kamu menabung >20% pemasukan.' : 'Usahakan sisihkan minimal 10-20% pemasukan untuk ditabung.',
  });

  // 4. Budget Rule 50/30/20 Adherence (Weight: 20%)
  // Needs <= 50%, Wants <= 30%, Savings >= 20%
  // We approximate using the categorization if provided, else rely on expense ratio
  let budgetScore = 0;
  let budgetStatus: 'good' | 'warning' | 'danger' = 'danger';

  const needsPct = (input.needsExpense / income) * 100;
  const wantsPct = (input.wantsExpense / income) * 100;

  if (input.totalIncome > 0) {
    if (needsPct <= 55 && wantsPct <= 35) {
      budgetScore = 100;
      budgetStatus = 'good';
    } else if (needsPct <= 65 && wantsPct <= 45) {
      budgetScore = 60;
      budgetStatus = 'warning';
    } else {
      budgetScore = 20;
    }
  }

  metrics.push({
    id: 'budget_rule',
    name: 'Proporsi Budget',
    score: budgetScore,
    status: budgetStatus,
    value: `Kebutuhan ${needsPct.toFixed(0)}%, Keinginan ${wantsPct.toFixed(0)}%`,
    recommendation: budgetStatus === 'good' ? 'Proporsi belanjamu sangat sehat.' : 'Kurangi porsi pengeluaran keinginan atau tekan biaya hidup rutin.',
  });

  // Calculate final weighted score
  totalScore = (efScore * 0.3) + (dtiScore * 0.3) + (srScore * 0.2) + (budgetScore * 0.2);
  const finalScore = Math.round(totalScore);

  let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
  if (finalScore >= 85) grade = 'A';
  else if (finalScore >= 70) grade = 'B';
  else if (finalScore >= 55) grade = 'C';
  else if (finalScore >= 40) grade = 'D';

  // Determine top improvement
  const worstMetric = [...metrics].sort((a, b) => a.score - b.score)[0];
  const topImprovement = worstMetric.recommendation;

  return {
    score: finalScore,
    grade,
    metrics,
    topImprovement,
  };
}

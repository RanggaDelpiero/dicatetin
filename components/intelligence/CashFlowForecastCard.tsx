"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { TrendUp, TrendDown, WarningCircle } from '@phosphor-icons/react';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useRecurringStore } from '@/lib/stores/recurring-store';
import { useDebtStore } from '@/lib/stores/debt-store';
import { useBudgetStore } from '@/lib/stores/budget-store';
import { buildCashFlowProjection } from '@/lib/finance/cash-flow';
import { getToday, formatDate } from '@/lib/utils/date';
import { formatCurrency } from '@/lib/utils/currency';
import { CashFlowChart } from '@/components/charts/CashFlowChart';

export function CashFlowForecastCard() {
  const [days, setDays] = useState<7 | 14 | 30>(14);
  const [isClient, setIsClient] = useState(false);

  const { wallets } = useWalletStore();
  const { transactions } = useTransactionStore();
  const { recurringTransactions } = useRecurringStore();
  const { debts } = useDebtStore();
  const { budgets } = useBudgetStore();

  useEffect(() => {
    const timer = setTimeout(() => setIsClient(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const projection = useMemo(() => {
    if (!isClient) return null;

    const today = getToday();
    // Simplified transaction map to only upcoming stuff if needed, but the cash-flow module doesn't use past transactions for projection currently
    return buildCashFlowProjection({
      wallets,
      transactions: [],
      recurringTransactions,
      debts: debts.map(d => ({
        id: d.id,
        creditor: d.creditor,
        remaining: d.remaining_amount,
        total: d.total_amount,
        status: d.status,
        due_date: d.due_date
      })),
      budgets,
      todayDate: today,
      projectionDays: days,
      includeDailyBudgetBurn: true,
    });
  }, [wallets, transactions, recurringTransactions, debts, budgets, days, isClient]);

  if (!isClient || !projection) return <div className="h-48 rounded-xl bg-bg-secondary animate-pulse" />;

  const isDanger = projection.riskLevel === 'danger';
  const isCaution = projection.riskLevel === 'caution';

  return (
    <div className="bg-bg-elevated rounded-[var(--radius-card)] p-4 shadow-card border border-border-light relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-text-primary text-[15px]">Proyeksi Arus Kas</h3>
          <p className="text-[12px] text-text-secondary">Sisa saldo dalam {days} hari</p>
        </div>
        
        {/* Simple Segmented Control */}
        <div className="flex items-center bg-bg-secondary p-1 rounded-lg">
          {[7, 14, 30].map(d => (
            <button
              key={d}
              onClick={() => setDays(d as 7 | 14 | 30)}
              className={`text-[11px] font-medium px-3 py-1 rounded-md transition-colors ${days === d ? 'bg-bg-elevated text-text-primary shadow-sm' : 'text-text-secondary'}`}
            >
              {d}H
            </button>
          ))}
        </div>
      </div>

      {/* Main Metric */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className={`text-[24px] font-bold tabular-nums ${isDanger ? 'text-accent-danger' : 'text-text-primary'}`}>
            {formatCurrency(projection.projectedBalance)}
          </span>
        </div>
        
        {isDanger && (
          <div className="flex items-center gap-1.5 mt-1 text-accent-danger text-[12px] font-medium bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md w-fit">
            <WarningCircle size={14} weight="fill" />
            <span>Awas, saldo diproyeksikan minus pada {formatDate(projection.lowestProjectedDate)}</span>
          </div>
        )}
        {isCaution && !isDanger && (
          <div className="flex items-center gap-1.5 mt-1 text-accent-warning text-[12px] font-medium bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-md w-fit">
            <WarningCircle size={14} weight="fill" />
            <span>Saldo menipis hingga {formatCurrency(projection.lowestProjectedBalance)}</span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-[120px] w-full -ml-1">
        <CashFlowChart series={projection.series} lowestBalance={projection.lowestProjectedBalance} />
      </div>

      {/* Upcoming Events List */}
      {projection.events.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border-light">
          <p className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-2">Agenda {days} Hari Kedepan</p>
          <div className="flex flex-col gap-2">
            {projection.events.slice(0, 3).map((event, i) => (
              <div key={i} className="flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-2 text-text-primary">
                  {event.type === 'income' ? (
                    <div className="w-6 h-6 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-accent-primary">
                      <TrendUp size={12} weight="bold" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-accent-danger">
                      <TrendDown size={12} weight="bold" />
                    </div>
                  )}
                  <span className="line-clamp-1">{event.label}</span>
                </div>
                <span className={`tabular-nums font-medium ${event.type === 'income' ? 'text-accent-primary' : 'text-text-primary'}`}>
                  {event.type === 'income' ? '+' : '-'}{formatCurrency(event.amount)}
                </span>
              </div>
            ))}
            {projection.events.length > 3 && (
              <p className="text-[12px] text-text-tertiary text-center mt-1">+{projection.events.length - 3} agenda lainnya</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

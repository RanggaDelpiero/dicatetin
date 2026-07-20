"use client";

import React, { useMemo } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts';
import { formatCurrency } from '@/lib/utils/currency';

interface CashFlowChartProps {
  series: { date: string; balance: number }[];
  lowestBalance: number;
}

export function CashFlowChart({ series, lowestBalance }: CashFlowChartProps) {
  const chartData = useMemo(() => {
    return series.map(point => ({
      date: formatDate(point.date),
      rawDate: point.date,
      balance: point.balance,
      // For shading logic
      isNegative: point.balance < 0,
    }));
  }, [series]);

  // Gradient for the area
  const renderGradient = () => {
    // If it dips below 0, we can use a dynamic gradient with a stop at 0
    // But since Recharts doesn't natively support dynamic gradient stops easily without knowing max/min,
    // we use a simpler approach or defined thresholds if needed.
    // For now, we use the primary accent color.
    return (
      <defs>
        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
          <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="var(--accent-danger)" stopOpacity={0.3} />
          <stop offset="95%" stopColor="var(--accent-danger)" stopOpacity={0} />
        </linearGradient>
      </defs>
    );
  };

  const renderTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const isDanger = val < 0;
      return (
        <div className="glass px-3 py-2 rounded-lg border border-border-light shadow-card text-xs">
          <p className="text-text-secondary mb-1">{label}</p>
          <p className={`font-semibold tabular-nums ${isDanger ? 'text-accent-danger' : 'text-text-primary'}`}>
            {formatCurrency(val)}
          </p>
        </div>
      );
    }
    return null;
  };

  const minBalance = Math.min(...series.map(s => s.balance), 0);
  const maxBalance = Math.max(...series.map(s => s.balance), 0);

  return (
    <div className="w-full h-full relative" aria-label={`Grafik proyeksi arus kas. Saldo terendah ${formatCurrency(lowestBalance)}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          {renderGradient()}
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} 
            dy={10}
            minTickGap={30}
          />
          <YAxis 
            hide 
            domain={[minBalance < 0 ? minBalance * 1.1 : 0, maxBalance * 1.1]} 
          />
          <Tooltip content={renderTooltip} cursor={{ stroke: 'var(--text-tertiary)', strokeWidth: 1, strokeDasharray: '4 4' }} />
          {minBalance < 0 && (
            <ReferenceLine y={0} stroke="var(--accent-danger)" strokeDasharray="3 3" opacity={0.5} />
          )}
          <Area 
            type="monotone" 
            dataKey="balance" 
            stroke={lowestBalance < 0 ? "var(--accent-danger)" : "var(--accent-primary)"} 
            strokeWidth={3}
            fillOpacity={1} 
            fill={lowestBalance < 0 ? "url(#colorNegative)" : "url(#colorBalance)"} 
            activeDot={{ r: 6, strokeWidth: 0, fill: lowestBalance < 0 ? "var(--accent-danger)" : "var(--accent-primary)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

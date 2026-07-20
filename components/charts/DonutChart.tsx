// ============================================
// Pundi — Donut Chart Component
// ============================================

"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface DonutChartProps {
  data: { name: string; value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
}

export function DonutChart({ data, size = 100, strokeWidth = 20 }: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const centerX = size / 2;
  const centerY = size / 2;

  // Calculate total
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <svg width={size} height={size}>
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="var(--border-light)"
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  // Build segments
  const segments = data.map((d, i) => {
    const percentage = d.value / total;
    const segmentLength = percentage * circumference;
    const gapSize = 3; // gap between segments
    const dashArray = `${Math.max(segmentLength - gapSize, 1)} ${circumference - Math.max(segmentLength - gapSize, 1)}`;
    const prevOffset = data.slice(0, i).reduce((sum, item) => sum + (item.value / total) * circumference, 0);
    const rotation = (prevOffset / circumference) * 360 - 90;

    return {
      ...d,
      dashArray,
      rotation,
      percentage,
    };
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="var(--border-light)"
          strokeWidth={strokeWidth}
        />

        {/* Segments */}
        {segments.map((seg, i) => (
          <motion.circle
            key={seg.name}
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={seg.dashArray}
            strokeLinecap="round"
            transform={`rotate(${seg.rotation} ${centerX} ${centerY})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
          />
        ))}
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-text-primary">
          {data.length}
        </span>
        <span className="text-[10px] text-text-tertiary">kategori</span>
      </div>
    </div>
  );
}

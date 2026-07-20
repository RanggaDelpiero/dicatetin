// ============================================
// Pundi — Financial Insights Carousel
// ============================================

"use client";

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Insight } from '@/lib/insights/insights';

interface InsightsCarouselProps {
  insights: Insight[];
}

export function InsightsCarousel({ insights }: InsightsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const constraintsRef = useRef<HTMLDivElement>(null);

  if (insights.length === 0) {
    return (
      <div className="rounded-[14px] bg-gradient-to-r from-accent-secondary/10 to-accent-primary/10 border border-accent-secondary/20 p-4 text-center">
        <p className="text-3xl mb-2">✨</p>
        <p className="text-sm text-text-secondary">
          Insight akan muncul setelah kamu mulai mencatat transaksi!
        </p>
      </div>
    );
  }

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold && currentIndex < insights.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (info.offset.x > threshold && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="space-y-2">
      {/* Carousel Container */}
      <div ref={constraintsRef} className="overflow-hidden rounded-[14px]">
        <motion.div
          className="flex"
          animate={{ x: `-${currentIndex * 100}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
        >
          {insights.map((insight) => (
            <motion.div
              key={insight.id}
              className={`flex-shrink-0 w-full rounded-[14px] bg-gradient-to-r ${insight.gradient} border border-accent-secondary/10 p-5`}
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-bg-elevated/80 backdrop-blur flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-xl">{insight.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-text-primary mb-1">{insight.title}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{insight.body}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Dot Indicators */}
      {insights.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {insights.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`rounded-full transition-all ${
                i === currentIndex
                  ? 'w-5 h-1.5 bg-accent-secondary'
                  : 'w-1.5 h-1.5 bg-text-tertiary/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

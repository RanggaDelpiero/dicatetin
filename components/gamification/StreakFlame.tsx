// ============================================
// Pundi — Streak Flame Indicator
// ============================================

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Fire } from '@phosphor-icons/react';
import { useGamificationStore } from '@/lib/stores/gamification-store';
import { getStreakColor } from '@/lib/gamification/streak';

export function StreakFlame() {
  const { progress } = useGamificationStore();
  const streakColor = getStreakColor(progress.streak_days);

  return (
    <motion.div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-secondary"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.5 }}
    >
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          rotate: [-3, 3, -3],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Fire
          size={20}
          weight="fill"
          style={{ color: streakColor }}
        />
      </motion.div>
      <span
        className="text-sm font-bold tabular-nums"
        style={{ color: streakColor }}
      >
        {progress.streak_days}
      </span>
    </motion.div>
  );
}

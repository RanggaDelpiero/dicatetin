// ============================================
// Pundi — Level Up Celebration Modal
// ============================================

"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamificationStore } from '@/lib/stores/gamification-store';
import { getLevelTitle } from '@/lib/gamification/xp';
import { haptic } from '@/lib/utils/haptic';

const confettiColors = ['#FFC53D', '#22C55E', '#6366F1', '#EC4899', '#3B82F6', '#F97316'];

function ConfettiPiece({ index }: { index: number }) {
  // Use lazy initialization for random values to avoid hydration mismatch
  // and keep the component pure during render
  const [config] = useState(() => ({
    color: confettiColors[index % confettiColors.length],
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
    yTarget: -(150 + Math.random() * 200),
    xTarget: (Math.random() - 0.5) * 200,
    rotateTarget: Math.random() > 0.5 ? 1 : -1,
    duration: 1.5 + Math.random() * 0.5
  }));

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${config.left}%`,
        top: '50%',
        width: config.size,
        height: config.size,
        backgroundColor: config.color,
        borderRadius: config.borderRadius,
        rotate: config.rotation,
      }}
      initial={{ y: 0, opacity: 1, scale: 1 }}
      animate={{
        y: [0, config.yTarget],
        x: [config.xTarget],
        opacity: [1, 1, 0],
        rotate: config.rotation + 360 * config.rotateTarget,
        scale: [1, 0.5],
      }}
      transition={{
        duration: config.duration,
        delay: config.delay,
        ease: [0.32, 0.72, 0, 1],
      }}
    />
  );
}

export function LevelUpModal() {
  const { showLevelUpModal, newLevel, dismissLevelUp } = useGamificationStore();
  const [confetti, setConfetti] = useState<number[]>([]);

  useEffect(() => {
    if (showLevelUpModal) {
      haptic('success');
      // Trigger confetti after a small delay to allow modal to mount,
      // preventing synchronous setState during render phase if called in layout
      const initTimer = setTimeout(() => {
        setConfetti(Array.from({ length: 30 }, (_, i) => i));
      }, 50);

      const timer = setTimeout(() => setConfetti([]), 2500);
      return () => {
        clearTimeout(initTimer);
        clearTimeout(timer);
      };
    }
  }, [showLevelUpModal]);

  return (
    <AnimatePresence>
      {showLevelUpModal && newLevel && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismissLevelUp} />

          {/* Confetti */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {confetti.map((i) => (
              <ConfettiPiece key={i} index={i} />
            ))}
          </div>

          {/* Card */}
          <motion.div
            className="relative z-10 bg-bg-elevated rounded-3xl p-8 mx-6 text-center shadow-2xl max-w-sm w-full"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Mascot */}
            <motion.div
              className="text-6xl mb-4"
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 0.6, delay: 0.3, type: 'spring', stiffness: 400 }}
            >
              🐷
            </motion.div>

            {/* Level badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gamify-gold/20 mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
            >
              <span className="text-gamify-gold font-bold text-lg">Level {newLevel}</span>
            </motion.div>

            <h2 className="text-2xl font-bold text-text-primary mb-2">
              Level Naik! 🎉
            </h2>
            <p className="text-text-secondary mb-1">
              Sekarang kamu jadi
            </p>
            <p className="text-lg font-semibold gradient-text mb-6">
              {getLevelTitle(newLevel)}
            </p>
            <p className="text-text-tertiary text-sm mb-6">
              Pundi makin gendut nih 🐷✨
            </p>

            <button
              onClick={dismissLevelUp}
              className="w-full py-3.5 rounded-2xl bg-accent-primary text-white font-semibold text-base active:scale-[0.98] transition-transform"
            >
              Lanjut Yuk! 💪
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

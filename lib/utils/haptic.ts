// ============================================
// Pundi — Haptic Feedback Utility
// ============================================

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'error';

const patterns: Record<HapticStyle, number[]> = {
  light: [10],
  medium: [20],
  heavy: [40],
  success: [15, 50, 15], // double-pulse
  error: [30, 50, 30, 50, 30],
};

/**
 * Trigger haptic feedback if supported
 * Degrades gracefully on unsupported devices
 */
export function haptic(style: HapticStyle = 'light'): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(patterns[style]);
  }
}

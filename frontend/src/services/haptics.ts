/**
 * Lightweight Haptic Feedback utility for mobile touch ergonomics
 * Employs Navigator.vibrate API where supported by mobile devices.
 */
export const haptics = {
  /** Light touch tick when tapping product buttons (+ / -) */
  tap: () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
    } catch {
      // Ignored if browser policy restricts
    }
  },

  /** Positive feedback on order creation or KOT print */
  success: () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([15, 40, 20]);
      }
    } catch {
      // Ignored
    }
  },

  /** Warning or error haptic on discard or payment validation */
  warning: () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([35, 30, 35]);
      }
    } catch {
      // Ignored
    }
  }
};

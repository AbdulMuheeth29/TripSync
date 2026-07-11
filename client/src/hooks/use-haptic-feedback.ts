/**
 * Haptic Feedback Hook for Mobile Devices
 * Provides tactile feedback for user interactions
 */

export type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error";

export function useHapticFeedback() {
  const isSupported = typeof window !== "undefined" && "vibrate" in navigator;

  const vibrate = (pattern: number | number[]) => {
    if (!isSupported) return;

    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn("Haptic feedback failed:", error);
    }
  };

  const trigger = (style: HapticStyle = "light") => {
    if (!isSupported) return;

    const patterns: Record<HapticStyle, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 30,
      success: [10, 50, 10], // Double tap
      warning: [10, 100, 10, 100, 10], // Triple tap
      error: [30, 50, 30, 50, 30] // Strong triple tap
    };

    vibrate(patterns[style]);
  };

  // Selection feedback (like iOS picker)
  const selection = () => trigger("light");

  // Impact feedback (like button press)
  const impact = (intensity: "light" | "medium" | "heavy" = "medium") => {
    trigger(intensity);
  };

  // Notification feedback
  const notification = (type: "success" | "warning" | "error") => {
    trigger(type);
  };

  return {
    trigger,
    selection,
    impact,
    notification,
    isSupported
  };
}

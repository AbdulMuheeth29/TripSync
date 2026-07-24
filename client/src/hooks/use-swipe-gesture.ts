import { useRef, useState, useEffect } from 'react';

interface UseSwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  velocity?: number;
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  velocity = 0.3,
}: UseSwipeGestureOptions) {
  const elementRef = useRef<HTMLElement | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDistance, setSwipeDistance] = useState({ x: 0, y: 0 });

  const touchStart = useRef({ x: 0, y: 0, time: 0 });
  const touchCurrent = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      setIsSwiping(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping) return;

      const touch = e.touches[0];
      touchCurrent.current = {
        x: touch.clientX,
        y: touch.clientY,
      };

      const deltaX = touchCurrent.current.x - touchStart.current.x;
      const deltaY = touchCurrent.current.y - touchStart.current.y;

      setSwipeDistance({ x: deltaX, y: deltaY });

      // Prevent scroll when swiping horizontally
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      if (!isSwiping) return;

      const deltaX = swipeDistance.x;
      const deltaY = swipeDistance.y;
      const deltaTime = Date.now() - touchStart.current.time;
      const velocityX = Math.abs(deltaX) / deltaTime;
      const velocityY = Math.abs(deltaY) / deltaTime;

      // Determine swipe direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) >= threshold && velocityX >= velocity) {
          if (deltaX > 0) {
            onSwipeRight?.();
          } else {
            onSwipeLeft?.();
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) >= threshold && velocityY >= velocity) {
          if (deltaY > 0) {
            onSwipeDown?.();
          } else {
            onSwipeUp?.();
          }
        }
      }

      // Reset
      setIsSwiping(false);
      setSwipeDistance({ x: 0, y: 0 });
      touchStart.current = { x: 0, y: 0, time: 0 };
      touchCurrent.current = { x: 0, y: 0 };
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [
    isSwiping,
    swipeDistance,
    threshold,
    velocity,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
  ]);

  return {
    elementRef,
    isSwiping,
    swipeDistance,
    getTransform: () => ({
      transform: isSwiping ? `translateX(${swipeDistance.x}px)` : 'translateX(0)',
      transition: isSwiping ? 'none' : 'transform 0.3s ease',
    }),
  };
}

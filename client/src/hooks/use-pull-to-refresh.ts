import { useEffect, useRef, useState } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
  enabled?: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
  enabled = true,
}: UsePullToRefreshOptions) {
  const containerRef = useRef<HTMLElement | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const touchStartY = useRef(0);
  const touchMoveY = useRef(0);
  const isAtTop = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current || document.documentElement;

    const handleTouchStart = (e: TouchEvent) => {
      if (isRefreshing) return;

      touchStartY.current = e.touches[0].clientY;
      isAtTop.current = container.scrollTop === 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isRefreshing || !isAtTop.current) return;

      touchMoveY.current = e.touches[0].clientY;
      const distance = touchMoveY.current - touchStartY.current;

      if (distance > 0) {
        // Apply resistance
        const resistedDistance = Math.min(distance / resistance, threshold * 1.5);
        setPullDistance(resistedDistance);

        // Prevent default scroll when pulling
        if (distance > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (isRefreshing) return;

      if (pullDistance >= threshold) {
        setIsRefreshing(true);
        setPullDistance(threshold); // Lock at threshold

        try {
          await onRefresh();
        } finally {
          // Smooth reset
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
          }, 300);
        }
      } else {
        // Snap back
        setPullDistance(0);
      }

      touchStartY.current = 0;
      touchMoveY.current = 0;
      isAtTop.current = false;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, isRefreshing, pullDistance, threshold, resistance, onRefresh]);

  const getContainerStyle = () => {
    if (pullDistance === 0) return {};

    return {
      transform: `translateY(${pullDistance}px)`,
      transition: isRefreshing ? 'transform 0.3s ease' : 'transform 0.1s ease',
    };
  };

  const getIndicatorStyle = () => {
    const opacity = Math.min(pullDistance / threshold, 1);
    const rotation = (pullDistance / threshold) * 360;

    return {
      opacity,
      transform: `rotate(${rotation}deg) scale(${opacity})`,
      transition: isRefreshing ? 'all 0.3s ease' : 'all 0.1s ease',
    };
  };

  return {
    containerRef,
    isRefreshing,
    pullDistance,
    isActive: pullDistance > 0,
    isTriggered: pullDistance >= threshold,
    getContainerStyle,
    getIndicatorStyle,
  };
}

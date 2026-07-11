import { ReactNode, useEffect, useRef, useState } from "react";

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  containerHeight?: number;
  overscan?: number;
  className?: string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  containerHeight = 600,
  overscan = 3,
  className = ""
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight);

  // Calculate visible range with overscan
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    startIndex + visibleCount + overscan * 2
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Smooth scroll restoration
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const savedScrollTop = sessionStorage.getItem(`virtuallist-scroll-${containerRef.current?.id}`);
    if (savedScrollTop) {
      container.scrollTop = parseInt(savedScrollTop, 10);
    }

    return () => {
      if (container) {
        sessionStorage.setItem(
          `virtuallist-scroll-${container.id}`,
          container.scrollTop.toString()
        );
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-y-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        {visibleItems.map((item, index) => {
          const actualIndex = startIndex + index;
          return (
            <div
              key={actualIndex}
              style={{
                position: "absolute",
                top: actualIndex * itemHeight,
                height: itemHeight,
                left: 0,
                right: 0
              }}
            >
              {renderItem(item, actualIndex)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

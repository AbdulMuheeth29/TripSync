import { ReactNode } from "react";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { Loader2 } from "lucide-react";

interface PullToRefreshWrapperProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
  enabled?: boolean;
}

export function PullToRefreshWrapper({
  onRefresh,
  children,
  threshold = 80,
  enabled = true
}: PullToRefreshWrapperProps) {
  const {
    containerRef,
    isRefreshing,
    pullDistance,
    isTriggered,
    getContainerStyle,
    getIndicatorStyle
  } = usePullToRefresh({
    onRefresh,
    threshold,
    enabled
  });

  return (
    <div className="relative overflow-hidden">
      {/* Pull Indicator */}
      {pullDistance > 0 && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center z-50 pointer-events-none"
          style={{
            height: `${Math.min(pullDistance, threshold)}px`
          }}
        >
          <div
            className="flex items-center justify-center"
            style={getIndicatorStyle()}
          >
            <Loader2
              className={`h-6 w-6 text-primary ${
                isRefreshing || isTriggered ? "animate-spin" : ""
              }`}
            />
          </div>
        </div>
      )}

      {/* Content Container */}
      <div
        ref={containerRef as any}
        style={getContainerStyle()}
      >
        {children}
      </div>
    </div>
  );
}

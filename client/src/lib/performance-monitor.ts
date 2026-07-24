/**
 * Performance Monitoring for Mobile Optimization
 * Tracks key performance metrics for iOS, Android, and Web
 */

interface PerformanceMetrics {
  // Core Web Vitals
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte

  // Custom metrics
  timeToInteractive?: number;
  bundleSize?: number;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  platform?: 'ios' | 'android' | 'web';
  networkSpeed?: 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'offline';
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window === 'undefined') return;

    this.detectDevice();
    this.detectNetworkSpeed();
    this.observePerformance();
  }

  private detectDevice() {
    const width = window.innerWidth;

    if (width < 768) {
      this.metrics.deviceType = 'mobile';
    } else if (width < 1024) {
      this.metrics.deviceType = 'tablet';
    } else {
      this.metrics.deviceType = 'desktop';
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      this.metrics.platform = 'ios';
    } else if (/android/.test(userAgent)) {
      this.metrics.platform = 'android';
    } else {
      this.metrics.platform = 'web';
    }
  }

  private detectNetworkSpeed() {
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (connection) {
      this.metrics.networkSpeed = connection.effectiveType || '4g';

      // Monitor network changes
      connection.addEventListener('change', () => {
        this.metrics.networkSpeed = connection.effectiveType;
        this.reportMetrics();
      });
    }
  }

  private observePerformance() {
    if (!('PerformanceObserver' in window)) return;

    try {
      // Observe First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.FCP = entry.startTime;
          }
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(fcpObserver);

      // Observe Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.metrics.LCP = lastEntry.renderTime || lastEntry.loadTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // Observe First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.FID = (entry as any).processingStart - entry.startTime;
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // Observe Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        this.metrics.CLS = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (error) {
      console.warn('Performance observer setup failed:', error);
    }

    // Measure TTFB
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      this.metrics.TTFB = timing.responseStart - timing.requestStart;
    }

    // Report metrics after page load
    window.addEventListener('load', () => {
      setTimeout(() => this.reportMetrics(), 1000);
    });
  }

  private reportMetrics() {
    console.log('[Performance]', this.metrics);

    // Send to analytics (if configured)
    if ((window as any).analytics) {
      (window as any).analytics.track('Performance Metrics', this.metrics);
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public markFeature(name: string) {
    if (window.performance && window.performance.mark) {
      window.performance.mark(name);
    }
  }

  public measureFeature(name: string, startMark: string, endMark?: string) {
    if (window.performance && window.performance.measure) {
      try {
        window.performance.measure(name, startMark, endMark || undefined);

        const measures = window.performance.getEntriesByName(name);
        if (measures.length > 0) {
          console.log(`[Performance] ${name}:`, measures[0].duration.toFixed(2), 'ms');
        }
      } catch (error) {
        console.warn('Performance measurement failed:', error);
      }
    }
  }

  public disconnect() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitoring(componentName: string) {
  const startMark = `${componentName}-start`;
  const endMark = `${componentName}-end`;

  // Mark component mount
  performanceMonitor.markFeature(startMark);

  return {
    markComplete: () => {
      performanceMonitor.markFeature(endMark);
      performanceMonitor.measureFeature(componentName, startMark, endMark);
    },
    getMetrics: () => performanceMonitor.getMetrics(),
  };
}

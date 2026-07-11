/**
 * Analytics Utility
 * Supports PostHog (recommended) and Google Analytics
 */

type AnalyticsEvent = {
  name: string;
  properties?: Record<string, any>;
};

class Analytics {
  private enabled: boolean = false;
  private provider: 'posthog' | 'ga' | null = null;
  private posthog: any = null;

  /**
   * Initialize analytics
   * Call this once in main.tsx
   */
  async init() {
    const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
    const gaId = import.meta.env.VITE_GA_TRACKING_ID;

    // Prefer PostHog (better privacy, more features)
    if (posthogKey) {
      try {
        const posthogModule = await import('posthog-js');
        this.posthog = posthogModule.default;

        this.posthog.init(posthogKey, {
          api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
          loaded: (posthog: any) => {
            // Only track in production by default
            if (import.meta.env.DEV) {
              posthog.opt_out_capturing();
            }
          },
          autocapture: true,
          capture_pageview: true,
          capture_pageleave: true,
          disable_session_recording: import.meta.env.DEV, // No session recording in dev
        });

        this.provider = 'posthog';
        this.enabled = true;
        console.log('[Analytics] PostHog initialized');
      } catch (error) {
        console.error('[Analytics] Failed to load PostHog:', error);
      }
    }
    // Fallback to Google Analytics
    else if (gaId) {
      try {
        // Load gtag.js
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        document.head.appendChild(script);

        // Initialize gtag
        (window as any).dataLayer = (window as any).dataLayer || [];
        const gtag = (...args: any[]) => {
          (window as any).dataLayer.push(args);
        };
        gtag('js', new Date());
        gtag('config', gaId, {
          send_page_view: true,
        });

        (window as any).gtag = gtag;

        this.provider = 'ga';
        this.enabled = true;
        console.log('[Analytics] Google Analytics initialized');
      } catch (error) {
        console.error('[Analytics] Failed to load Google Analytics:', error);
      }
    } else {
      console.log('[Analytics] No analytics provider configured');
    }
  }

  /**
   * Track a custom event
   */
  track(eventName: string, properties?: Record<string, any>) {
    if (!this.enabled) return;

    if (this.provider === 'posthog' && this.posthog) {
      this.posthog.capture(eventName, properties);
    } else if (this.provider === 'ga' && (window as any).gtag) {
      (window as any).gtag('event', eventName, properties);
    }
  }

  /**
   * Track a page view
   */
  page(pageName?: string, properties?: Record<string, any>) {
    if (!this.enabled) return;

    if (this.provider === 'posthog' && this.posthog) {
      this.posthog.capture('$pageview', {
        ...properties,
        $current_url: window.location.href,
        page_name: pageName,
      });
    } else if (this.provider === 'ga' && (window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_title: pageName || document.title,
        page_location: window.location.href,
        page_path: window.location.pathname,
        ...properties,
      });
    }
  }

  /**
   * Identify a user
   */
  identify(userId: string, traits?: Record<string, any>) {
    if (!this.enabled) return;

    if (this.provider === 'posthog' && this.posthog) {
      this.posthog.identify(userId, traits);
    } else if (this.provider === 'ga' && (window as any).gtag) {
      (window as any).gtag('config', import.meta.env.VITE_GA_TRACKING_ID, {
        user_id: userId,
        user_properties: traits,
      });
    }
  }

  /**
   * Reset user identity (on logout)
   */
  reset() {
    if (!this.enabled) return;

    if (this.provider === 'posthog' && this.posthog) {
      this.posthog.reset();
    }
    // GA doesn't have a reset method
  }

  /**
   * Check if analytics is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get current provider
   */
  getProvider(): 'posthog' | 'ga' | null {
    return this.provider;
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Convenience functions for common events
export const trackEvent = {
  // User events
  signUp: (method: 'email' | 'google') => {
    analytics.track('sign_up', { method });
  },

  signIn: (method: 'email' | 'google') => {
    analytics.track('sign_in', { method });
  },

  signOut: () => {
    analytics.track('sign_out');
    analytics.reset();
  },

  // Trip events
  tripCreated: (tripId: string, destination: string) => {
    analytics.track('trip_created', { trip_id: tripId, destination });
  },

  tripDeleted: (tripId: string) => {
    analytics.track('trip_deleted', { trip_id: tripId });
  },

  tripShared: (tripId: string, method: 'email' | 'link') => {
    analytics.track('trip_shared', { trip_id: tripId, method });
  },

  // Itinerary events
  itemAdded: (tripId: string, type: string) => {
    analytics.track('itinerary_item_added', { trip_id: tripId, type });
  },

  itemVoted: (tripId: string, itemId: string, vote: 'up' | 'down') => {
    analytics.track('item_voted', { trip_id: tripId, item_id: itemId, vote });
  },

  // AI events
  aiGenerateTrip: (tripId: string, duration: number) => {
    analytics.track('ai_generate_trip', { trip_id: tripId, duration_days: duration });
  },

  aiChatMessage: (tripId: string) => {
    analytics.track('ai_chat_message', { trip_id: tripId });
  },

  // Expense events
  expenseAdded: (tripId: string, amount: number, currency: string) => {
    analytics.track('expense_added', { trip_id: tripId, amount, currency });
  },

  expenseSettled: (tripId: string, expenseId: string) => {
    analytics.track('expense_settled', { trip_id: tripId, expense_id: expenseId });
  },

  // Collaboration events
  memberInvited: (tripId: string, role: string) => {
    analytics.track('member_invited', { trip_id: tripId, role });
  },

  memberJoined: (tripId: string) => {
    analytics.track('member_joined', { trip_id: tripId });
  },

  // Feature usage
  featureUsed: (feature: string, context?: Record<string, any>) => {
    analytics.track('feature_used', { feature, ...context });
  },

  // Errors
  error: (errorType: string, message: string, context?: Record<string, any>) => {
    analytics.track('error_occurred', {
      error_type: errorType,
      message: message.substring(0, 100), // Truncate long messages
      ...context
    });
  },
};

// Hook for React components
export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    page: analytics.page.bind(analytics),
    identify: analytics.identify.bind(analytics),
    trackEvent,
  };
}

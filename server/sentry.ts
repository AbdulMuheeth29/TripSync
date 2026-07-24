import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import type { Express, Request, Response, NextFunction } from 'express';

/**
 * Initialize Sentry error tracking and performance monitoring
 */
export function initSentry(app: Express): void {
  const sentryDsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';

  // Only initialize Sentry if DSN is provided
  if (!sentryDsn) {
    console.warn('⚠️  SENTRY_DSN not configured. Error tracking disabled.');
    return;
  }

  console.log(`🔍 Initializing Sentry error tracking (${environment})...`);

  Sentry.init({
    dsn: sentryDsn,
    environment,

    // Performance monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
    profilesSampleRate: environment === 'production' ? 0.1 : 1.0,

    integrations: [
      // HTTP integration for automatic instrumentation
      Sentry.httpIntegration(),

      // Express integration for automatic request tracking
      Sentry.expressIntegration(),

      // Profiling integration for performance insights
      nodeProfilingIntegration(),

      // PostgreSQL integration (if available)
      Sentry.postgresIntegration(),
    ],

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
      }

      // Remove sensitive POST body fields
      if (event.request?.data && typeof event.request.data === 'object') {
        const data = event.request.data as Record<string, any>;
        if ('password' in data) {
          data.password = '[Filtered]';
        }
        if ('passwordHash' in data) {
          data.passwordHash = '[Filtered]';
        }
        if ('token' in data) {
          data.token = '[Filtered]';
        }
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser/network errors
      'NetworkError',
      'Failed to fetch',
      'Network request failed',
      // Expected business errors
      'AUTH_REQUIRED',
      'INVALID_CREDENTIALS',
      'ACCESS_DENIED',
    ],
  });

  console.log('✅ Sentry initialized successfully');
}

/**
 * Sentry request handler middleware
 * Must be the first middleware
 */
export function sentryRequestHandler() {
  // No-op for compatibility - modern SDK handles this automatically via expressIntegration
  return (_req: any, _res: any, next: any) => next();
}

/**
 * Sentry tracing middleware
 * Should be after request handler
 */
export function sentryTracingHandler() {
  // No-op for compatibility - modern SDK handles this automatically via expressIntegration
  return (_req: any, _res: any, next: any) => next();
}

/**
 * Sentry error handler middleware
 * Must be after all routes and before other error handlers
 */
export function sentryErrorHandler() {
  // Error handler for Express - captures exceptions and sends to Sentry
  return (err: any, req: any, res: any, next: any) => {
    Sentry.captureException(err);
    next(err);
  };
}

/**
 * Capture an exception and send to Sentry
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Capture a message and send to Sentry
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info'
): void {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export function setUserContext(userId: string, email?: string, username?: string): void {
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUserContext(): void {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  data?: Record<string, any>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
    timestamp: Date.now() / 1000,
  });
}

/**
 * Flush Sentry events before shutdown
 */
export async function flushSentry(timeout = 2000): Promise<boolean> {
  return Sentry.flush(timeout);
}

// Export Sentry instance for advanced usage
export { Sentry };

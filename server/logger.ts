import pino from 'pino';
import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

/**
 * Create Pino logger instance with appropriate configuration
 */
export const logger = pino({
  level: isTest ? 'silent' : process.env.LOG_LEVEL || 'info',

  // Pretty print in development, JSON in production
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      }
    : undefined,

  // Base properties included in every log
  base: {
    env: process.env.NODE_ENV || 'development',
    app: 'trip-sync',
  },

  // Redact sensitive fields
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-api-key"]',
      'res.headers["set-cookie"]',
      'password',
      'passwordHash',
      'token',
      'secret',
      'apiKey',
    ],
    remove: true,
  },

  // Serialize errors properly
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
});

/**
 * HTTP request logger middleware with correlation IDs
 */
export function httpLogger() {
  return pinoHttp({
    logger,

    // Generate unique request ID for correlation
    genReqId: (req) => {
      // Use existing request ID if present, otherwise generate new one
      return req.headers['x-request-id'] as string || randomUUID();
    },

    // Add request ID to response headers
    customSuccessMessage: (req, res) => {
      return `${req.method} ${req.url} ${res.statusCode}`;
    },

    customErrorMessage: (req, res) => {
      return `${req.method} ${req.url} ${res.statusCode}`;
    },

    // Custom log level based on status code
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 500 || err) {
        return 'error';
      }
      if (res.statusCode >= 400) {
        return 'warn';
      }
      if (res.statusCode >= 300) {
        return 'info';
      }
      return 'info';
    },

    // Custom request properties to log
    customProps: (req: Request) => {
      return {
        userId: (req as any).userId || undefined,
        userEmail: (req as any).userEmail || undefined,
        tripId: req.params?.tripId || req.params?.id || undefined,
      };
    },

    // Don't log health check requests in production
    autoLogging: {
      ignore: (req) => {
        return req.url === '/api/health' && process.env.NODE_ENV === 'production';
      },
    },
  });
}

/**
 * Add request correlation ID middleware
 * Must be before httpLogger
 */
export function correlationIdMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Generate or use existing correlation ID
    const correlationId = (req.headers['x-request-id'] as string) || randomUUID();

    // Attach to request for use in route handlers
    (req as any).correlationId = correlationId;

    // Add to response headers
    res.setHeader('X-Request-ID', correlationId);

    next();
  };
}

/**
 * Log with user context
 */
export function logWithUser(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  userId?: string,
  data?: Record<string, any>
) {
  logger[level]({
    ...data,
    userId,
  }, message);
}

/**
 * Log application events
 */
export const appLogger = {
  /**
   * Log server startup
   */
  startup: (host: string, port: number) => {
    logger.info({
      event: 'server_start',
      host,
      port,
    }, `Server listening on ${host}:${port}`);
  },

  /**
   * Log database connection
   */
  database: (message: string, metadata?: Record<string, any>) => {
    logger.info({
      event: 'database',
      ...metadata,
    }, message);
  },

  /**
   * Log migration events
   */
  migration: (message: string, metadata?: Record<string, any>) => {
    logger.info({
      event: 'migration',
      ...metadata,
    }, message);
  },

  /**
   * Log authentication events
   */
  auth: (event: 'login' | 'register' | 'logout' | 'token_refresh', userId?: string, metadata?: Record<string, any>) => {
    logger.info({
      event: `auth_${event}`,
      userId,
      ...metadata,
    }, `Authentication: ${event}`);
  },

  /**
   * Log AI service calls
   */
  ai: (operation: string, metadata?: Record<string, any>) => {
    logger.info({
      event: 'ai_operation',
      operation,
      ...metadata,
    }, `AI: ${operation}`);
  },

  /**
   * Log payment events
   */
  payment: (event: string, metadata?: Record<string, any>) => {
    logger.info({
      event: 'payment',
      paymentEvent: event,
      ...metadata,
    }, `Payment: ${event}`);
  },

  /**
   * Log errors with context
   */
  error: (error: Error, context?: Record<string, any>) => {
    logger.error({
      err: error,
      ...context,
    }, error.message);
  },

  /**
   * Log warnings
   */
  warn: (message: string, metadata?: Record<string, any>) => {
    logger.warn({
      ...metadata,
    }, message);
  },

  /**
   * Log debug information
   */
  debug: (message: string, metadata?: Record<string, any>) => {
    logger.debug({
      ...metadata,
    }, message);
  },
};

// Export logger for direct use
export default logger;

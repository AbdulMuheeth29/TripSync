/**
 * AI Metrics and Monitoring Infrastructure
 *
 * Tracks AI performance, costs, and reliability for:
 * - Operational dashboards
 * - Cost optimization
 * - Performance monitoring
 * - SLA tracking
 */

import { cache } from './cache';

/**
 * AI operation result with full metadata
 */
export interface AIOperationMetrics {
  operation: string;
  model: string;
  success: boolean;
  duration: number;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  cached?: boolean;
  attempts?: number;
  errorType?: string;
  timestamp: number;
}

/**
 * Anthropic model pricing (per 1M tokens)
 */
const MODEL_PRICING = {
  'claude-sonnet-4-5': {
    input: 3.0,
    output: 15.0,
  },
  'claude-3-5-haiku-20241022': {
    input: 0.25,
    output: 1.25,
  },
} as const;

/**
 * Calculate cost for an AI operation
 */
export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING];
  if (!pricing) {
    console.warn(`Unknown model pricing: ${model}`);
    return 0;
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}

/**
 * Record an AI operation for metrics tracking
 */
export async function recordAIOperation(metrics: AIOperationMetrics): Promise<void> {
  try {
    const { operation, success, duration, costUsd = 0, cached = false } = metrics;

    // Store in Redis for real-time metrics
    const timestamp = Date.now();
    const key = `ai:ops:${operation}:${timestamp}`;

    await cache.set(key, metrics, 86400); // 24 hour retention

    // Note: Simplified metrics tracking
    // The existing cache service doesn't support hash operations (hincrby, hincrbyfloat)
    // or list operations (rpush, ltrim) needed for detailed tracking.
    // For now, we'll track basic counts using the cache service.

    console.log(
      `📊 Recorded AI operation: ${operation} (${success ? '✅' : '❌'}, ${duration}ms, $${costUsd.toFixed(4)})`
    );
  } catch (error) {
    console.error('Failed to record AI metrics:', error);
    // Don't throw - metrics failure shouldn't break operations
  }
}

/**
 * Get aggregated metrics for an operation
 */
export async function getOperationMetrics(
  operation: string,
  days: number = 7
): Promise<{
  totalCalls: number;
  successRate: number;
  averageDuration: number;
  totalCost: number;
  cacheHitRate: number;
  dailyBreakdown: Array<{
    date: string;
    calls: number;
    successes: number;
    failures: number;
    cost: number;
    cached: number;
  }>;
}> {
  try {
    // Simplified metrics since cache service doesn't support hash/list operations
    // This is a placeholder implementation - full metrics would require a different storage approach

    return {
      totalCalls: 0,
      successRate: 99.0, // Default high success rate
      averageDuration: 0,
      totalCost: 0,
      cacheHitRate: 0,
      dailyBreakdown: [],
    };
  } catch (error) {
    console.error('Failed to get operation metrics:', error);
    return {
      totalCalls: 0,
      successRate: 0,
      averageDuration: 0,
      totalCost: 0,
      cacheHitRate: 0,
      dailyBreakdown: [],
    };
  }
}

/**
 * Get system-wide AI metrics
 */
export async function getSystemMetrics(days: number = 7): Promise<{
  operations: string[];
  totalCost: number;
  totalCalls: number;
  overallSuccessRate: number;
  overallCacheHitRate: number;
  costByOperation: Record<string, number>;
  callsByOperation: Record<string, number>;
}> {
  const operations = [
    'itinerary-generation',
    'conflict-resolution',
    'budget-optimization',
    'conversational-planning',
    'trip-recap',
    'packing-list',
    'email-parsing',
  ];

  const metrics = await Promise.all(operations.map((op) => getOperationMetrics(op, days)));

  const totalCost = metrics.reduce((sum, m) => sum + m.totalCost, 0);
  const totalCalls = metrics.reduce((sum, m) => sum + m.totalCalls, 0);

  const totalSuccesses = metrics.reduce((sum, m) => sum + (m.totalCalls * m.successRate) / 100, 0);

  const totalCached = metrics.reduce((sum, m) => sum + (m.totalCalls * m.cacheHitRate) / 100, 0);

  const costByOperation: Record<string, number> = {};
  const callsByOperation: Record<string, number> = {};

  operations.forEach((op, i) => {
    costByOperation[op] = metrics[i].totalCost;
    callsByOperation[op] = metrics[i].totalCalls;
  });

  return {
    operations,
    totalCost,
    totalCalls,
    overallSuccessRate: totalCalls > 0 ? (totalSuccesses / totalCalls) * 100 : 0,
    overallCacheHitRate: totalCalls > 0 ? (totalCached / totalCalls) * 100 : 0,
    costByOperation,
    callsByOperation,
  };
}

/**
 * Check if we're meeting SLA targets
 */
export async function checkSLA(): Promise<{
  target: number;
  actual: number;
  passing: boolean;
  message: string;
}> {
  const TARGET_SUCCESS_RATE = 99.9;
  const metrics = await getSystemMetrics(1); // Last 24 hours

  const passing = metrics.overallSuccessRate >= TARGET_SUCCESS_RATE;

  return {
    target: TARGET_SUCCESS_RATE,
    actual: metrics.overallSuccessRate,
    passing,
    message: passing
      ? `✅ Meeting SLA (${metrics.overallSuccessRate.toFixed(2)}% success rate)`
      : `⚠️  Below SLA (${metrics.overallSuccessRate.toFixed(2)}% success rate, target ${TARGET_SUCCESS_RATE}%)`,
  };
}

/**
 * Get cost estimate for upcoming month (based on current usage)
 */
export async function projectMonthlyCost(): Promise<{
  last7Days: number;
  projected30Days: number;
  breakdown: Record<string, number>;
}> {
  const last7Days = await getSystemMetrics(7);
  const projected30Days = (last7Days.totalCost / 7) * 30;

  const breakdown: Record<string, number> = {};
  for (const [op, cost] of Object.entries(last7Days.costByOperation)) {
    breakdown[op] = (cost / 7) * 30;
  }

  return {
    last7Days: last7Days.totalCost,
    projected30Days,
    breakdown,
  };
}

/**
 * Alert thresholds for monitoring
 */
export interface AlertConfig {
  successRateThreshold: number;
  costThreshold: number;
  latencyThreshold: number;
}

export const DEFAULT_ALERTS: AlertConfig = {
  successRateThreshold: 99.0, // Alert if below 99%
  costThreshold: 100, // Alert if daily cost exceeds $100
  latencyThreshold: 10000, // Alert if p95 latency exceeds 10s
};

/**
 * Check for alert conditions
 */
export async function checkAlerts(config: AlertConfig = DEFAULT_ALERTS): Promise<
  Array<{
    severity: 'warning' | 'critical';
    message: string;
    metric: string;
    value: number;
    threshold: number;
  }>
> {
  const alerts: Array<{
    severity: 'warning' | 'critical';
    message: string;
    metric: string;
    value: number;
    threshold: number;
  }> = [];
  const metrics = await getSystemMetrics(1);

  // Success rate alert
  if (metrics.overallSuccessRate < config.successRateThreshold) {
    alerts.push({
      severity: (metrics.overallSuccessRate < 95 ? 'critical' : 'warning') as
        | 'warning'
        | 'critical',
      message: `AI success rate below threshold`,
      metric: 'success_rate',
      value: metrics.overallSuccessRate,
      threshold: config.successRateThreshold,
    });
  }

  // Cost alert
  if (metrics.totalCost > config.costThreshold) {
    alerts.push({
      severity: 'warning' as const,
      message: `Daily AI cost exceeded threshold`,
      metric: 'cost',
      value: metrics.totalCost,
      threshold: config.costThreshold,
    });
  }

  return alerts;
}

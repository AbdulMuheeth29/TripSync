/**
 * AI Admin Dashboard Routes
 *
 * Endpoints for monitoring and managing AI infrastructure:
 * - Cost tracking and budgeting
 * - Performance metrics
 * - Circuit breaker status
 * - Cache hit rates
 * - Learning progress
 * - Atlas monitoring state
 */

import { Router } from 'express';
import { getAllCircuitBreakerStatus } from './ai-circuit-breaker';
import { getAllCacheMetrics } from './ai-cache';
import { getSystemMetrics, checkSLA, projectMonthlyCost, checkAlerts } from './ai-metrics';
import { getPreferenceAnalytics } from './preference-learning';
import { RetryMetrics } from './ai-retry';

const router = Router();

/**
 * GET /api/admin/ai/dashboard
 * Main AI dashboard overview
 */
router.get('/dashboard', async (req, res) => {
  try {
    const [
      systemMetrics,
      circuitBreakers,
      cacheMetrics,
      sla,
      costProjection,
      alerts,
      retryStats,
      preferenceAnalytics
    ] = await Promise.all([
      getSystemMetrics(7), // Last 7 days
      getAllCircuitBreakerStatus(),
      getAllCacheMetrics(),
      checkSLA(),
      projectMonthlyCost(),
      checkAlerts(),
      Promise.resolve(RetryMetrics.getStats()),
      getPreferenceAnalytics()
    ]);

    res.json({
      success: true,
      data: {
        // Overview
        overview: {
          totalCalls: systemMetrics.totalCalls,
          totalCost: systemMetrics.totalCost,
          successRate: systemMetrics.overallSuccessRate,
          cacheHitRate: systemMetrics.overallCacheHitRate,
          slaMet: sla.passing,
        },

        // Cost analysis
        costs: {
          last7Days: costProjection.last7Days,
          projected30Days: costProjection.projected30Days,
          byOperation: costProjection.breakdown,
        },

        // Reliability
        reliability: {
          sla: sla,
          circuitBreakers: circuitBreakers,
          retryStats: retryStats,
          alerts: alerts,
        },

        // Performance
        performance: {
          cacheHitRate: systemMetrics.overallCacheHitRate,
          cacheMetrics: cacheMetrics,
        },

        // Learning
        learning: {
          totalUsers: preferenceAnalytics.totalUsers,
          totalPreferences: preferenceAnalytics.totalPreferences,
          avgConfidence: preferenceAnalytics.avgConfidence,
          categoryCounts: preferenceAnalytics.categoryCounts,
        },

        // Operations breakdown
        operations: systemMetrics.costByOperation,
      }
    });
  } catch (error) {
    console.error('Failed to get AI dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load AI dashboard'
    });
  }
});

/**
 * GET /api/admin/ai/metrics
 * Detailed metrics for a specific operation
 */
router.get('/metrics/:operation', async (req, res) => {
  try {
    const { operation } = req.params;
    const days = parseInt(req.query.days as string) || 7;

    const metrics = await getSystemMetrics(days);

    res.json({
      success: true,
      data: {
        operation,
        ...metrics
      }
    });
  } catch (error) {
    console.error('Failed to get operation metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load metrics'
    });
  }
});

/**
 * GET /api/admin/ai/circuit-breakers
 * Circuit breaker status
 */
router.get('/circuit-breakers', async (req, res) => {
  try {
    const status = getAllCircuitBreakerStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Failed to get circuit breaker status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load circuit breaker status'
    });
  }
});

/**
 * POST /api/admin/ai/circuit-breakers/:name/reset
 * Manually reset a circuit breaker
 */
router.post('/circuit-breakers/:name/reset', async (req, res) => {
  try {
    const { name } = req.params;

    // Import circuit breakers
    const { aiCircuitBreakers } = await import('./ai-circuit-breaker');

    // Find the breaker
    const breakerMap: Record<string, any> = {
      'itinerary-generation': aiCircuitBreakers.itineraryGeneration,
      'suggestions': aiCircuitBreakers.suggestions,
      'extraction': aiCircuitBreakers.extraction,
    };

    const breaker = breakerMap[name];
    if (!breaker) {
      return res.status(404).json({
        success: false,
        error: 'Circuit breaker not found'
      });
    }

    breaker.reset();

    res.json({
      success: true,
      message: `Circuit breaker "${name}" reset successfully`
    });
  } catch (error) {
    console.error('Failed to reset circuit breaker:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset circuit breaker'
    });
  }
});

/**
 * GET /api/admin/ai/cache
 * Cache performance metrics
 */
router.get('/cache', async (req, res) => {
  try {
    const metrics = await getAllCacheMetrics();

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Failed to get cache metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load cache metrics'
    });
  }
});

/**
 * GET /api/admin/ai/costs
 * Cost analysis and projections
 */
router.get('/costs', async (req, res) => {
  try {
    const projection = await projectMonthlyCost();
    const systemMetrics = await getSystemMetrics(30);

    res.json({
      success: true,
      data: {
        current: {
          last7Days: projection.last7Days,
          last30Days: systemMetrics.totalCost,
        },
        projected: {
          monthly: projection.projected30Days,
          byOperation: projection.breakdown,
        },
        breakdown: systemMetrics.costByOperation,
      }
    });
  } catch (error) {
    console.error('Failed to get cost data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load cost data'
    });
  }
});

/**
 * GET /api/admin/ai/alerts
 * Active alerts and warnings
 */
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await checkAlerts();

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Failed to get alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load alerts'
    });
  }
});

/**
 * GET /api/admin/ai/learning
 * Preference learning analytics
 */
router.get('/learning', async (req, res) => {
  try {
    const analytics = await getPreferenceAnalytics();

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Failed to get learning analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load learning analytics'
    });
  }
});

/**
 * GET /api/admin/ai/sla
 * SLA status and compliance
 */
router.get('/sla', async (req, res) => {
  try {
    const sla = await checkSLA();
    const metrics = await getSystemMetrics(1); // Last 24 hours

    res.json({
      success: true,
      data: {
        sla,
        metrics: {
          successRate: metrics.overallSuccessRate,
          totalCalls: metrics.totalCalls,
          cacheHitRate: metrics.overallCacheHitRate,
        }
      }
    });
  } catch (error) {
    console.error('Failed to get SLA status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load SLA status'
    });
  }
});

export default router;

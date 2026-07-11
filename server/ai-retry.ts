/**
 * AI Retry Mechanism with Exponential Backoff
 *
 * Provides robust retry logic for AI operations to achieve 99.9% reliability.
 * Uses exponential backoff to handle transient failures gracefully.
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryableErrors?: string[];
}

export interface RetryResult<T> {
  data: T;
  attempts: number;
  totalDuration: number;
}

/**
 * Retry an async operation with exponential backoff
 *
 * @param operation - The async function to retry
 * @param options - Retry configuration
 * @returns The result with metadata about attempts
 *
 * @example
 * const result = await retryWithBackoff(
 *   () => anthropic.messages.create({...}),
 *   { maxRetries: 3, baseDelay: 1000 }
 * );
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 8000,
    retryableErrors = [
      'rate_limit_error',
      'overloaded_error',
      'timeout',
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'fetch failed',
    ]
  } = options;

  const startTime = Date.now();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const data = await operation();
      const totalDuration = Date.now() - startTime;

      console.log(`✅ AI operation succeeded on attempt ${attempt + 1}/${maxRetries} (${totalDuration}ms)`);

      return {
        data,
        attempts: attempt + 1,
        totalDuration
      };
    } catch (error: any) {
      lastError = error;

      // Check if error is retryable
      const isRetryable = retryableErrors.some(
        retryableError =>
          error?.message?.includes(retryableError) ||
          error?.type?.includes(retryableError) ||
          error?.code?.includes(retryableError)
      );

      const isLastAttempt = attempt === maxRetries - 1;

      if (!isRetryable || isLastAttempt) {
        console.error(`❌ AI operation failed (non-retryable or final attempt):`, {
          attempt: attempt + 1,
          maxRetries,
          error: error?.message || String(error),
          isRetryable
        });
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

      console.warn(`⚠️  AI operation failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms:`, {
        error: error?.message || String(error),
        nextAttempt: attempt + 2
      });

      // Wait before retrying
      await sleep(delay);
    }
  }

  // This should never be reached due to the throw in the loop
  throw lastError || new Error('Retry failed with unknown error');
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry multiple operations in parallel with individual retry logic
 *
 * @example
 * const results = await retryBatch([
 *   () => generateItinerary(trip1),
 *   () => generateItinerary(trip2)
 * ]);
 */
export async function retryBatch<T>(
  operations: (() => Promise<T>)[],
  options: RetryOptions = {}
): Promise<RetryResult<T>[]> {
  return Promise.all(
    operations.map(op => retryWithBackoff(op, options))
  );
}

/**
 * Track retry statistics for monitoring
 */
export class RetryMetrics {
  private static successCount = 0;
  private static failureCount = 0;
  private static totalAttempts = 0;
  private static totalDuration = 0;

  static recordSuccess(attempts: number, duration: number) {
    this.successCount++;
    this.totalAttempts += attempts;
    this.totalDuration += duration;
  }

  static recordFailure() {
    this.failureCount++;
  }

  static getStats() {
    const total = this.successCount + this.failureCount;
    return {
      successRate: total > 0 ? (this.successCount / total) * 100 : 0,
      averageAttempts: this.successCount > 0 ? this.totalAttempts / this.successCount : 0,
      averageDuration: this.successCount > 0 ? this.totalDuration / this.successCount : 0,
      totalSuccesses: this.successCount,
      totalFailures: this.failureCount
    };
  }

  static reset() {
    this.successCount = 0;
    this.failureCount = 0;
    this.totalAttempts = 0;
    this.totalDuration = 0;
  }
}

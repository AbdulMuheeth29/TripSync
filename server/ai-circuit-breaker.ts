/**
 * AI Circuit Breaker Pattern
 *
 * Prevents cascade failures when AI service is experiencing issues.
 * Automatically "opens" the circuit after too many failures, then gradually
 * tries again in "half-open" state.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Too many failures, reject immediately with clear error
 * - HALF_OPEN: Testing if service recovered, allow limited requests
 */

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;      // Failures before opening (default: 5)
  successThreshold?: number;      // Successes in half-open before closing (default: 2)
  timeout?: number;               // Time to wait before trying half-open (default: 30s)
  monitoringWindow?: number;      // Time window for counting failures (default: 60s)
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private openedAt: number | null = null;

  private readonly failureThreshold: number;
  private readonly successThreshold: number;
  private readonly timeout: number;
  private readonly monitoringWindow: number;

  constructor(private readonly name: string, options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.successThreshold = options.successThreshold ?? 2;
    this.timeout = options.timeout ?? 30000; // 30 seconds
    this.monitoringWindow = options.monitoringWindow ?? 60000; // 60 seconds
  }

  /**
   * Execute an operation through the circuit breaker
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit should transition to half-open
    if (this.state === CircuitState.OPEN && this.shouldAttemptReset()) {
      console.log(`🔄 Circuit breaker "${this.name}" transitioning to HALF_OPEN`);
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
    }

    // Reject immediately if circuit is open
    if (this.state === CircuitState.OPEN) {
      const waitTime = this.openedAt
        ? Math.ceil((this.timeout - (Date.now() - this.openedAt)) / 1000)
        : 0;

      throw new CircuitBreakerError(
        `AI service circuit breaker is OPEN for "${this.name}". ` +
        `Try again in ${waitTime}s. This prevents system overload during AI service issues.`,
        this.state
      );
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Record a successful operation
   */
  private onSuccess() {
    this.failureCount = 0;
    this.lastFailureTime = null;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      console.log(`✅ Circuit breaker "${this.name}" success in HALF_OPEN (${this.successCount}/${this.successThreshold})`);

      if (this.successCount >= this.successThreshold) {
        console.log(`🔓 Circuit breaker "${this.name}" closing (service recovered)`);
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        this.openedAt = null;
      }
    }
  }

  /**
   * Record a failed operation
   */
  private onFailure() {
    const now = Date.now();
    this.lastFailureTime = now;

    // Reset failure count if outside monitoring window
    if (this.lastFailureTime && (now - this.lastFailureTime) > this.monitoringWindow) {
      this.failureCount = 0;
    }

    this.failureCount++;

    console.warn(`⚠️  Circuit breaker "${this.name}" failure (${this.failureCount}/${this.failureThreshold})`);

    // Open circuit if threshold exceeded
    if (this.failureCount >= this.failureThreshold) {
      console.error(`🔒 Circuit breaker "${this.name}" OPENING (too many failures)`);
      this.state = CircuitState.OPEN;
      this.openedAt = now;
      this.successCount = 0;
    }

    // If in half-open, immediately reopen on failure
    if (this.state === CircuitState.HALF_OPEN) {
      console.error(`🔒 Circuit breaker "${this.name}" reopening (half-open test failed)`);
      this.state = CircuitState.OPEN;
      this.openedAt = now;
      this.successCount = 0;
    }
  }

  /**
   * Check if enough time has passed to try half-open
   */
  private shouldAttemptReset(): boolean {
    if (!this.openedAt) return false;
    return (Date.now() - this.openedAt) >= this.timeout;
  }

  /**
   * Get current circuit breaker status
   */
  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      openedAt: this.openedAt,
      lastFailureTime: this.lastFailureTime
    };
  }

  /**
   * Manually reset the circuit breaker (for testing/admin)
   */
  reset() {
    console.log(`🔄 Circuit breaker "${this.name}" manually reset`);
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.openedAt = null;
  }
}

/**
 * Custom error for circuit breaker trips
 */
export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public readonly state: CircuitState
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

/**
 * Global circuit breakers for different AI operations
 */
export const aiCircuitBreakers = {
  itineraryGeneration: new CircuitBreaker('itinerary-generation', {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 60000, // 1 minute for complex operations
  }),

  suggestions: new CircuitBreaker('suggestions', {
    failureThreshold: 10, // More lenient for simple operations
    successThreshold: 3,
    timeout: 30000, // 30 seconds
  }),

  extraction: new CircuitBreaker('extraction', {
    failureThreshold: 10,
    successThreshold: 3,
    timeout: 30000,
  }),
};

/**
 * Get status of all circuit breakers
 */
export function getAllCircuitBreakerStatus() {
  return Object.entries(aiCircuitBreakers).map(([key, breaker]) => ({
    key,
    ...breaker.getStatus()
  }));
}

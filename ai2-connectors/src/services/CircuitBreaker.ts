// --- 📦 CIRCUIT BREAKER ---
// embracingearth.space - Circuit breaker pattern for resilient service calls
// Prevents cascading failures by stopping requests to failing services

import { slackNotificationService } from './SlackNotificationService';

/**
 * Circuit Breaker State
 */
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * Circuit Breaker Configuration
 */
interface CircuitBreakerConfig {
  failureThreshold: number; // Open circuit after N failures
  timeout: number; // Time in ms before attempting half-open
  successThreshold: number; // Close circuit after N successes in half-open
}

/**
 * Circuit Breaker
 * Architecture: Prevents resource waste by stopping requests to failing services
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is failing, requests are rejected immediately
 * - HALF_OPEN: Testing if service recovered, limited requests allowed
 */
export class CircuitBreaker {
  private failures = 0;
  private successes = 0;
  private lastFailureTime = 0;
  private state: CircuitState = 'CLOSED';
  
  private readonly failureThreshold: number;
  private readonly timeout: number;
  private readonly successThreshold: number;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.failureThreshold = config.failureThreshold || 5;
    this.timeout = config.timeout || 60000; // 1 minute
    this.successThreshold = config.successThreshold || 2;
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
        this.successes = 0;
        console.log('🔄 Circuit breaker: OPEN → HALF_OPEN (testing recovery)');
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful request
   */
  private onSuccess(): void {
    this.failures = 0;

    if (this.state === 'HALF_OPEN') {
      this.successes++;
      if (this.successes >= this.successThreshold) {
        this.state = 'CLOSED';
        this.successes = 0;
        console.log('✅ Circuit breaker: HALF_OPEN → CLOSED (service recovered)');
      }
    } else if (this.state === 'OPEN') {
      // Shouldn't happen, but handle gracefully
      this.state = 'CLOSED';
    }
  }

  /**
   * Handle failed request
   */
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      // Failed during half-open, go back to OPEN
      this.state = 'OPEN';
      this.successes = 0;
      console.log('❌ Circuit breaker: HALF_OPEN → OPEN (service still failing)');
    } else if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      console.log(`🚨 Circuit breaker: CLOSED → OPEN (${this.failures} failures)`);
      
      // Send Slack alert when circuit opens (first time)
      if (this.failures === this.failureThreshold) {
        slackNotificationService.notifyError(
          `Circuit breaker opened after ${this.failures} failures`,
          {
            service: 'connectors-service',
            metadata: {
              failures: this.failures,
              threshold: this.failureThreshold
            }
          }
        ).catch(() => {}); // Don't block on notification failure
      }
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get failure count
   */
  getFailures(): number {
    return this.failures;
  }

  /**
   * Reset circuit breaker (for testing/manual recovery)
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = 0;
  }
}


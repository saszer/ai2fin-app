// --- 📦 CORE APP CLIENT ---
// embracingearth.space - Resilient HTTP client for core app communication
// Features: Timeout, retry, circuit breaker, connection pooling, rate limiting

import { CircuitBreaker } from './CircuitBreaker';
import http from 'http';
import https from 'https';

/**
 * Core App Client Configuration
 */
interface CoreAppClientConfig {
  baseUrl: string;
  serviceSecret: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
}

/**
 * Rate Limiter
 */
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    // Remove old requests outside window
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      // Calculate wait time
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.acquire(); // Retry after waiting
      }
    }

    this.requests.push(now);
  }
}

/**
 * Core App Client
 * Architecture: Resilient HTTP client with all enterprise features
 */
export class CoreAppClient {
  private readonly baseUrl: string;
  private readonly serviceSecret: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly rateLimiter: RateLimiter | null;
  private readonly httpAgent: http.Agent;
  private readonly httpsAgent: https.Agent;

  constructor(config: CoreAppClientConfig) {
    this.baseUrl = config.baseUrl;
    this.serviceSecret = config.serviceSecret;
    this.timeout = config.timeout || 10000; // 10 seconds
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;

    // Circuit breaker
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      timeout: 60000, // 1 minute
      successThreshold: 2
    });

    // Rate limiter
    if (config.rateLimit) {
      this.rateLimiter = new RateLimiter(
        config.rateLimit.maxRequests,
        config.rateLimit.windowMs
      );
    } else {
      this.rateLimiter = null;
    }

    // Connection pooling agents
    this.httpAgent = new http.Agent({
      keepAlive: true,
      maxSockets: 50,
      maxFreeSockets: 10,
      timeout: this.timeout
    });

    this.httpsAgent = new https.Agent({
      keepAlive: true,
      maxSockets: 50,
      maxFreeSockets: 10,
      timeout: this.timeout
    });
  }

  /**
   * POST request with all resilience features
   */
  async post(
    endpoint: string,
    payload: any,
    options: {
      userId?: string;
      idempotencyKey?: string;
    } = {}
  ): Promise<any> {
    // Rate limiting
    if (this.rateLimiter) {
      await this.rateLimiter.acquire();
    }

    // Execute with circuit breaker
    return this.circuitBreaker.execute(async () => {
      return this.executeWithRetry(endpoint, payload, options);
    });
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry(
    endpoint: string,
    payload: any,
    options: {
      userId?: string;
      idempotencyKey?: string;
    }
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await this.executeRequest(endpoint, payload, options);
      } catch (error: any) {
        lastError = error;

        // Don't retry on 4xx errors (client errors)
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }

        // Don't retry on timeout if it's the last attempt
        if (attempt === this.maxRetries - 1) {
          throw error;
        }

        // Exponential backoff
        const delay = Math.min(
          this.retryDelay * Math.pow(2, attempt),
          10000 // Max 10 seconds
        );

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Execute single HTTP request with timeout
   */
  private async executeRequest(
    endpoint: string,
    payload: any,
    options: {
      userId?: string;
      idempotencyKey?: string;
    }
  ): Promise<any> {
    const url = new URL(endpoint, this.baseUrl);
    const isHttps = url.protocol === 'https:';
    const agent = isHttps ? this.httpsAgent : this.httpAgent;

    return new Promise((resolve, reject) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-service-secret': this.serviceSecret,
        'Authorization': `Bearer ${this.serviceSecret}`
      };

      if (options.userId) {
        headers['x-user-id'] = options.userId;
      }

      if (options.idempotencyKey) {
        headers['Idempotency-Key'] = options.idempotencyKey;
      }

      const requestOptions = {
        method: 'POST',
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        headers,
        agent,
        timeout: this.timeout // ✅ Timeout support in Node.js http/https
      };

      const req = (isHttps ? https : http).request(requestOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const result = data ? JSON.parse(data) : {};
              resolve(result);
            } catch (error) {
              resolve({});
            }
          } else {
            const error: any = new Error(`HTTP ${res.statusCode}: ${data}`);
            error.status = res.statusCode;
            reject(error);
          }
        });
      });

      // Handle timeout
      req.setTimeout(this.timeout, () => {
        req.destroy();
        const error: any = new Error('Request timeout');
        error.status = 408;
        reject(error);
      });

      // Handle errors
      req.on('error', (error) => {
        reject(error);
      });

      // Handle request timeout (different from socket timeout)
      req.on('timeout', () => {
        req.destroy();
        const error: any = new Error('Request timeout');
        error.status = 408;
        reject(error);
      });

      req.write(JSON.stringify(payload));
      req.end();
    });
  }

  /**
   * Get circuit breaker state
   */
  getCircuitBreakerState(): string {
    return this.circuitBreaker.getState();
  }

  /**
   * Reset circuit breaker (for testing/manual recovery)
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }
}

// Singleton instance
let coreAppClientInstance: CoreAppClient | null = null;

export function getCoreAppClient(): CoreAppClient {
  if (!coreAppClientInstance) {
    const coreAppUrl = process.env.CORE_APP_URL || 'http://localhost:3001';
    const serviceSecret = process.env.SERVICE_SECRET || '';

    coreAppClientInstance = new CoreAppClient({
      baseUrl: coreAppUrl,
      serviceSecret,
      timeout: parseInt(process.env.CORE_APP_TIMEOUT || '10000', 10),
      maxRetries: parseInt(process.env.CORE_APP_MAX_RETRIES || '3', 10),
      retryDelay: parseInt(process.env.CORE_APP_RETRY_DELAY || '1000', 10),
      rateLimit: process.env.CORE_APP_RATE_LIMIT_ENABLED !== 'false' ? {
        maxRequests: parseInt(process.env.CORE_APP_RATE_LIMIT_MAX || '100', 10),
        windowMs: parseInt(process.env.CORE_APP_RATE_LIMIT_WINDOW || '60000', 10)
      } : undefined
    });
  }

  return coreAppClientInstance;
}


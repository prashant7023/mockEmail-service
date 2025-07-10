import { IEmailProvider, EmailMessage, EmailResult } from '../types';

/**
 * Mock email provider B - simulates a less reliable provider with different failure patterns
 */
export class MockEmailProviderB implements IEmailProvider {
  public readonly id = 'provider-b';
  public readonly name = 'Mock Provider B';
  private failureRate: number;
  private latencyMs: number;
  private isDown: boolean = false;

  constructor(failureRate: number = 0.15, latencyMs: number = 200) {
    this.failureRate = failureRate;
    this.latencyMs = latencyMs;
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    // Simulate network latency
    await this.delay(this.latencyMs);

    // Simulate provider being down
    if (this.isDown) {
      throw new Error(`${this.name}: Service temporarily unavailable`);
    }

    // Simulate random failures
    if (Math.random() < this.failureRate) {
      throw new Error(`${this.name}: Authentication failed or rate limit exceeded`);
    }

    // Simulate specific failure for testing
    if (message.subject.includes('FORCE_FAILURE_B')) {
      throw new Error(`${this.name}: Forced failure for testing`);
    }

    return {
      id: message.id,
      success: true,
      providerId: this.id,
      timestamp: new Date(),
      attempts: 1
    };
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.delay(75);
      return !this.isDown && Math.random() > 0.1; // 90% healthy when not down
    } catch {
      return false;
    }
  }

  /**
   * Set failure rate for testing
   */
  setFailureRate(rate: number): void {
    this.failureRate = Math.max(0, Math.min(1, rate));
  }

  /**
   * Set latency for testing
   */
  setLatency(ms: number): void {
    this.latencyMs = Math.max(0, ms);
  }

  /**
   * Simulate provider being down
   */
  setDown(isDown: boolean): void {
    this.isDown = isDown;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

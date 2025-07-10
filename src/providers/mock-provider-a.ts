import { IEmailProvider, EmailMessage, EmailResult } from '../types';

/**
 * Mock email provider A - simulates a reliable provider with occasional failures
 */
export class MockEmailProviderA implements IEmailProvider {
  public readonly id = 'provider-a';
  public readonly name = 'Mock Provider A';
  private failureRate: number;
  private latencyMs: number;

  constructor(failureRate: number = 0.1, latencyMs: number = 100) {
    this.failureRate = failureRate;
    this.latencyMs = latencyMs;
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    // Simulate network latency
    await this.delay(this.latencyMs);

    // Simulate random failures
    if (Math.random() < this.failureRate) {
      throw new Error(`${this.name}: Network timeout or server error`);
    }

    // Simulate specific failure for testing
    if (message.subject.includes('FORCE_FAILURE_A')) {
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
      await this.delay(50);
      return Math.random() > 0.05; // 95% healthy
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

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

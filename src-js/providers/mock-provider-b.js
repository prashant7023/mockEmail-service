/**
 * Mock email provider B - simulates a less reliable provider with different failure patterns
 */
class MockEmailProviderB {
  constructor(failureRate = 0.15, latencyMs = 200) {
    this.id = 'provider-b';
    this.name = 'Mock Provider B';
    this.failureRate = failureRate;
    this.latencyMs = latencyMs;
    this.isDown = false;
  }

  async send(message) {
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

  async isHealthy() {
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
  setFailureRate(rate) {
    this.failureRate = Math.max(0, Math.min(1, rate));
  }

  /**
   * Set latency for testing
   */
  setLatency(ms) {
    this.latencyMs = Math.max(0, ms);
  }

  /**
   * Simulate provider being down
   */
  setDown(isDown) {
    this.isDown = isDown;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { MockEmailProviderB };

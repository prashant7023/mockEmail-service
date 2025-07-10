
class MockEmailProviderA {
  constructor(failureRate = 0.1, latencyMs = 100) {
    this.id = 'provider-a';
    this.name = 'Mock Provider A';
    this.failureRate = failureRate;
    this.latencyMs = latencyMs;
  }
  async send(message) {
    await this.delay(this.latencyMs);
    if (Math.random() < this.failureRate) {
      throw new Error(`${this.name}: Network timeout or server error`);
    }
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
  async isHealthy() {
    try {
      await this.delay(50);
      return Math.random() > 0.05; // 95% healthy
    } catch {
      return false;
    }
  }
  setFailureRate(rate) {
    this.failureRate = Math.max(0, Math.min(1, rate));
  }
  setLatency(ms) {
    this.latencyMs = Math.max(0, ms);
  }
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
module.exports = { MockEmailProviderA };


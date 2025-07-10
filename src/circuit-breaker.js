const { CircuitBreakerState } = require('./types');
class CircuitBreaker {
  constructor(threshold, timeout) {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.threshold = threshold;
    this.timeout = timeout; // milliseconds
  }
  async execute(fn) {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = CircuitBreakerState.HALF_OPEN;
      } else {
        throw new Error('Circuit breaker is OPEN');
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
  getState() {
    return this.state;
  }
  getFailureCount() {
    return this.failureCount;
  }
  reset() {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
  onSuccess() {
    this.failureCount = 0;
    this.state = CircuitBreakerState.CLOSED;
  }
  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.threshold) {
      this.state = CircuitBreakerState.OPEN;
    }
  }
}
module.exports = { CircuitBreaker };


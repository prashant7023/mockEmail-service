/**
 * Token bucket rate limiter implementation
 */
class TokenBucketRateLimiter {
  constructor(capacity, refillRate) {
    this.capacity = capacity;
    this.refillRate = refillRate; // tokens per minute
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  /**
   * Check if a request is allowed based on current token availability
   */
  isAllowed() {
    this.refillTokens();
    
    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }
    
    return false;
  }

  /**
   * Reset the rate limiter
   */
  reset() {
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
  }

  /**
   * Get current token count (for testing)
   */
  getCurrentTokens() {
    this.refillTokens();
    return this.tokens;
  }

  refillTokens() {
    const now = Date.now();
    const timeSinceLastRefill = now - this.lastRefill;
    const tokensToAdd = Math.floor((timeSinceLastRefill / (60 * 1000)) * this.refillRate);
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }
}

module.exports = { TokenBucketRateLimiter };

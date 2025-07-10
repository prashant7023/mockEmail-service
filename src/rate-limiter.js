
class TokenBucketRateLimiter {
  constructor(capacity, refillRate) {
    this.capacity = capacity;
    this.refillRate = refillRate; // tokens per minute
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }
  isAllowed() {
    this.refillTokens();
    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }
    return false;
  }
  reset() {
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
  }
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


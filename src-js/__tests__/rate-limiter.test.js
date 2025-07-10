const { TokenBucketRateLimiter } = require('../rate-limiter');

describe('TokenBucketRateLimiter', () => {
  it('should allow requests within rate limit', () => {
    const limiter = new TokenBucketRateLimiter(5, 60); // 5 requests per minute
    
    // Should allow 5 requests
    for (let i = 0; i < 5; i++) {
      expect(limiter.isAllowed()).toBe(true);
    }
    
    // 6th request should be denied
    expect(limiter.isAllowed()).toBe(false);
  });

  it('should reset properly', () => {
    const limiter = new TokenBucketRateLimiter(2, 60);
    
    // Exhaust tokens
    expect(limiter.isAllowed()).toBe(true);
    expect(limiter.isAllowed()).toBe(true);
    expect(limiter.isAllowed()).toBe(false);
    
    // Reset and try again
    limiter.reset();
    expect(limiter.isAllowed()).toBe(true);
    expect(limiter.isAllowed()).toBe(true);
    expect(limiter.isAllowed()).toBe(false);
  });

  it('should refill tokens over time', async () => {
    const limiter = new TokenBucketRateLimiter(2, 60); // 2 requests per minute
    
    // Exhaust tokens
    expect(limiter.isAllowed()).toBe(true);
    expect(limiter.isAllowed()).toBe(true);
    expect(limiter.isAllowed()).toBe(false);
    
    // Fast forward time by mocking Date.now
    const originalNow = Date.now;
    Date.now = jest.fn(() => originalNow() + 60000); // 60 seconds later = 1 minute
    
    // Should have 2 new tokens after 1 minute (60 tokens per minute)
    expect(limiter.isAllowed()).toBe(true);
    expect(limiter.isAllowed()).toBe(true);
    expect(limiter.isAllowed()).toBe(false);
    
    // Restore original Date.now
    Date.now = originalNow;
  });
});

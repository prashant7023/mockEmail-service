const { TokenBucketRateLimiter } = require('../rate-limiter');
describe('TokenBucketRateLimiter', () => {
  it('should allow requests within rate limit', () => {
    const limiter = new TokenBucketRateLimiter(5, 60); // 5 requests per minute
    for (let i = 0; i < 5; i++) {
      expect(limiter.isAllowed()).toBe(true);
    }
    expect(limiter.isAllowed()).toBe(false);
  });
  it('should reset properly', () => {
    const limiter = new TokenBucketRateLimiter(2, 60);
    expect(limiter.isAllowed()).toBe(true);
    expect(limiter.isAllowed()).toBe(true);
    expect(limiter.isAllowed()).toBe(false);
    limiter.reset();
    expect(limiter.isAllowed()).toBe(true);
    expect(limiter.isAllowed()).toBe(true);
    expect(limiter.isAllowed()).toBe(false);
  });
  it('should refill tokens over time', async () => {
    const limiter = new TokenBucketRateLimiter(2, 60); // 2 requests per minute
    expect(limiter.isAllowed()).toBe(true);
    expect(limiter.isAllowed()).toBe(true);
    expect(limiter.isAllowed()).toBe(false);
    const originalNow = Date.now;
    Date.now = jest.fn(() => originalNow() + 60000); // 60 seconds later = 1 minute
    expect(limiter.isAllowed()).toBe(true);
    expect(limiter.isAllowed()).toBe(true);
    expect(limiter.isAllowed()).toBe(false);
    Date.now = originalNow;
  });
});


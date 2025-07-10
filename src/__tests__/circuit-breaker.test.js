const { CircuitBreaker } = require('../circuit-breaker');
const { CircuitBreakerState } = require('../types');
describe('CircuitBreaker', () => {
  it('should start in CLOSED state', () => {
    const cb = new CircuitBreaker(3, 5000);
    expect(cb.getState()).toBe(CircuitBreakerState.CLOSED);
    expect(cb.getFailureCount()).toBe(0);
  });
  it('should open after threshold failures', async () => {
    const cb = new CircuitBreaker(2, 5000);
    const failingFunction = jest.fn().mockRejectedValue(new Error('Test error'));
    await expect(cb.execute(failingFunction)).rejects.toThrow('Test error');
    expect(cb.getState()).toBe(CircuitBreakerState.CLOSED);
    expect(cb.getFailureCount()).toBe(1);
    await expect(cb.execute(failingFunction)).rejects.toThrow('Test error');
    expect(cb.getState()).toBe(CircuitBreakerState.OPEN);
    expect(cb.getFailureCount()).toBe(2);
    const newFunction = jest.fn().mockResolvedValue('success');
    await expect(cb.execute(newFunction)).rejects.toThrow('Circuit breaker is OPEN');
    expect(newFunction).not.toHaveBeenCalled();
  });
  it('should transition to HALF_OPEN after timeout', async () => {
    const cb = new CircuitBreaker(1, 100); // 100ms timeout
    const failingFunction = jest.fn().mockRejectedValue(new Error('Test error'));
    await expect(cb.execute(failingFunction)).rejects.toThrow('Test error');
    expect(cb.getState()).toBe(CircuitBreakerState.OPEN);
    await new Promise(resolve => setTimeout(resolve, 150));
    const successFunction = jest.fn().mockResolvedValue('success');
    const result = await cb.execute(successFunction);
    expect(result).toBe('success');
    expect(cb.getState()).toBe(CircuitBreakerState.CLOSED);
    expect(cb.getFailureCount()).toBe(0);
  });
  it('should reset properly', async () => {
    const cb = new CircuitBreaker(1, 5000);
    const failingFunction = jest.fn().mockRejectedValue(new Error('Test error'));
    await expect(cb.execute(failingFunction)).rejects.toThrow('Test error');
    expect(cb.getState()).toBe(CircuitBreakerState.OPEN);
    cb.reset();
    expect(cb.getState()).toBe(CircuitBreakerState.CLOSED);
    expect(cb.getFailureCount()).toBe(0);
    const successFunction = jest.fn().mockResolvedValue('success');
    const result = await cb.execute(successFunction);
    expect(result).toBe('success');
  });
  it('should close circuit on successful execution in HALF_OPEN state', async () => {
    const cb = new CircuitBreaker(1, 10);
    await expect(cb.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();
    expect(cb.getState()).toBe(CircuitBreakerState.OPEN);
    await new Promise(resolve => setTimeout(resolve, 15));
    const result = await cb.execute(() => Promise.resolve('success'));
    expect(result).toBe('success');
    expect(cb.getState()).toBe(CircuitBreakerState.CLOSED);
  });
});


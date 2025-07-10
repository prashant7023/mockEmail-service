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
    
    // First failure
    await expect(cb.execute(failingFunction)).rejects.toThrow('Test error');
    expect(cb.getState()).toBe(CircuitBreakerState.CLOSED);
    expect(cb.getFailureCount()).toBe(1);
    
    // Second failure - should open circuit
    await expect(cb.execute(failingFunction)).rejects.toThrow('Test error');
    expect(cb.getState()).toBe(CircuitBreakerState.OPEN);
    expect(cb.getFailureCount()).toBe(2);
    
    // Third call should fail immediately
    const newFunction = jest.fn().mockResolvedValue('success');
    await expect(cb.execute(newFunction)).rejects.toThrow('Circuit breaker is OPEN');
    expect(newFunction).not.toHaveBeenCalled();
  });

  it('should transition to HALF_OPEN after timeout', async () => {
    const cb = new CircuitBreaker(1, 100); // 100ms timeout
    const failingFunction = jest.fn().mockRejectedValue(new Error('Test error'));
    
    // Cause failure to open circuit
    await expect(cb.execute(failingFunction)).rejects.toThrow('Test error');
    expect(cb.getState()).toBe(CircuitBreakerState.OPEN);
    
    // Wait for timeout
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Next call should transition to HALF_OPEN
    const successFunction = jest.fn().mockResolvedValue('success');
    const result = await cb.execute(successFunction);
    
    expect(result).toBe('success');
    expect(cb.getState()).toBe(CircuitBreakerState.CLOSED);
    expect(cb.getFailureCount()).toBe(0);
  });

  it('should reset properly', async () => {
    const cb = new CircuitBreaker(1, 5000);
    const failingFunction = jest.fn().mockRejectedValue(new Error('Test error'));
    
    // Open the circuit
    await expect(cb.execute(failingFunction)).rejects.toThrow('Test error');
    expect(cb.getState()).toBe(CircuitBreakerState.OPEN);
    
    // Reset
    cb.reset();
    expect(cb.getState()).toBe(CircuitBreakerState.CLOSED);
    expect(cb.getFailureCount()).toBe(0);
    
    // Should work normally
    const successFunction = jest.fn().mockResolvedValue('success');
    const result = await cb.execute(successFunction);
    expect(result).toBe('success');
  });

  it('should close circuit on successful execution in HALF_OPEN state', async () => {
    const cb = new CircuitBreaker(1, 10);
    
    // Open circuit
    await expect(cb.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();
    expect(cb.getState()).toBe(CircuitBreakerState.OPEN);
    
    // Wait for timeout
    await new Promise(resolve => setTimeout(resolve, 15));
    
    // Successful execution should close circuit
    const result = await cb.execute(() => Promise.resolve('success'));
    expect(result).toBe('success');
    expect(cb.getState()).toBe(CircuitBreakerState.CLOSED);
  });
});

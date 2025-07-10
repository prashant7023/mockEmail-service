const { MockEmailProviderA } = require('../providers/mock-provider-a');
const { MockEmailProviderB } = require('../providers/mock-provider-b');
describe('MockEmailProviders', () => {
  const createTestMessage = () => ({
    id: `test-${Date.now()}-${Math.random()}`,
    to: ['test@example.com'],
    from: 'sender@example.com',
    subject: 'Test Email',
    body: 'Test email body'
  });
  describe('MockEmailProviderA', () => {
    it('should send email successfully with default settings', async () => {
      const provider = new MockEmailProviderA(0, 0); // No failures, no latency
      const message = createTestMessage();
      const result = await provider.send(message);
      expect(result.success).toBe(true);
      expect(result.id).toBe(message.id);
      expect(result.providerId).toBe('provider-a');
      expect(result.attempts).toBe(1);
    });
    it('should fail when forced failure is triggered', async () => {
      const provider = new MockEmailProviderA(0, 0);
      const message = createTestMessage();
      message.subject = 'FORCE_FAILURE_A test';
      await expect(provider.send(message)).rejects.toThrow('Forced failure for testing');
    });
    it('should respect failure rate', async () => {
      const provider = new MockEmailProviderA(1.0, 0); // 100% failure rate
      const message = createTestMessage();
      await expect(provider.send(message)).rejects.toThrow();
    });
    it('should report health status', async () => {
      const provider = new MockEmailProviderA();
      const isHealthy = await provider.isHealthy();
      expect(typeof isHealthy).toBe('boolean');
    });
    it('should allow configuration changes', async () => {
      const provider = new MockEmailProviderA(0, 0);
      provider.setFailureRate(1.0);
      provider.setLatency(100);
      const message = createTestMessage();
      await expect(provider.send(message)).rejects.toThrow();
    });
  });
  describe('MockEmailProviderB', () => {
    it('should send email successfully with default settings', async () => {
      const provider = new MockEmailProviderB(0, 0);
      const message = createTestMessage();
      const result = await provider.send(message);
      expect(result.success).toBe(true);
      expect(result.id).toBe(message.id);
      expect(result.providerId).toBe('provider-b');
    });
    it('should fail when provider is down', async () => {
      const provider = new MockEmailProviderB(0, 0);
      provider.setDown(true);
      const message = createTestMessage();
      await expect(provider.send(message)).rejects.toThrow('Service temporarily unavailable');
    });
    it('should recover when provider comes back up', async () => {
      const provider = new MockEmailProviderB(0, 0);
      const message = createTestMessage();
      provider.setDown(true);
      await expect(provider.send(message)).rejects.toThrow();
      provider.setDown(false);
      const result = await provider.send(message);
      expect(result.success).toBe(true);
    });
    it('should handle forced failures', async () => {
      const provider = new MockEmailProviderB(0, 0);
      const message = createTestMessage();
      message.subject = 'FORCE_FAILURE_B test';
      await expect(provider.send(message)).rejects.toThrow('Forced failure for testing');
    });
  });
});


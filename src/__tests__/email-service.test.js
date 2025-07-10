const { EmailService } = require('../email-service');
const { MockEmailProviderA } = require('../providers/mock-provider-a');
const { MockEmailProviderB } = require('../providers/mock-provider-b');
const { EmailStatus } = require('../types');
describe('EmailService', () => {
  const createTestMessage = () => ({
    id: `test-${Date.now()}-${Math.random()}`,
    to: ['test@example.com'],
    from: 'sender@example.com',
    subject: 'Test Email',
    body: 'Test email body'
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('Constructor', () => {
    it('should throw error if no providers are given', () => {
      expect(() => new EmailService([])).toThrow('At least one email provider is required');
    });
    it('should initialize with default config', () => {
      const provider = new MockEmailProviderA();
      const service = new EmailService([provider]);
      expect(service).toBeInstanceOf(EmailService);
    });
    it('should accept custom config', () => {
      const provider = new MockEmailProviderA();
      const config = { maxRetries: 5, baseDelayMs: 2000 };
      const service = new EmailService([provider], config);
      expect(service).toBeInstanceOf(EmailService);
    });
  });
  describe('Email Sending', () => {
    it('should send email successfully with first provider', async () => {
      const providerA = new MockEmailProviderA(0, 0); // No failures
      const providerB = new MockEmailProviderB(0, 0);
      const service = new EmailService([providerA, providerB]);
      const message = createTestMessage();
      const result = await service.sendEmail(message);
      expect(result.success).toBe(true);
      expect(result.providerId).toBe('provider-a');
      expect(result.attempts).toBe(1);
    });
    it('should fallback to second provider when first fails', async () => {
      const providerA = new MockEmailProviderA(1.0, 0); // Always fails
      const providerB = new MockEmailProviderB(0, 0); // Always succeeds
      const service = new EmailService([providerA, providerB]);
      const message = createTestMessage();
      const result = await service.sendEmail(message);
      expect(result.success).toBe(true);
      expect(result.providerId).toBe('provider-b');
    });
    it('should retry with exponential backoff', async () => {
      const providerA = new MockEmailProviderA(1.0, 0); // Always fails
      const providerB = new MockEmailProviderB(1.0, 0); // Always fails
      const service = new EmailService([providerA, providerB], { 
        maxRetries: 2,
        baseDelayMs: 100 
      });
      const message = createTestMessage();
      const startTime = Date.now();
      await expect(service.sendEmail(message)).rejects.toThrow();
      const endTime = Date.now();
      const duration = endTime - startTime;
      expect(duration).toBeGreaterThan(100);
    });
    it('should track email status correctly', async () => {
      const provider = new MockEmailProviderA(0, 0);
      const service = new EmailService([provider]);
      const message = createTestMessage();
      await service.sendEmail(message);
      const status = service.getEmailStatus(message.id);
      expect(status).toBeDefined();
      expect(status.status).toBe(EmailStatus.SENT);
      expect(status.attempts).toBe(1);
      expect(status.providerId).toBe('provider-a');
    });
    it('should implement idempotency', async () => {
      const provider = new MockEmailProviderA(0, 0);
      const service = new EmailService([provider]);
      const message = createTestMessage();
      const result1 = await service.sendEmail(message);
      expect(result1.success).toBe(true);
      const result2 = await service.sendEmail(message);
      expect(result2.success).toBe(true);
      expect(result2.providerId).toBe(result1.providerId);
    });
    it('should respect rate limiting', async () => {
      const provider = new MockEmailProviderA(0, 0);
      const service = new EmailService([provider], { 
        rateLimitPerMinute: 2 
      });
      const message1 = createTestMessage();
      const message2 = createTestMessage();
      const message3 = createTestMessage();
      await service.sendEmail(message1);
      await service.sendEmail(message2);
      await expect(service.sendEmail(message3)).rejects.toThrow('Rate limit exceeded');
    });
  });
  describe('Queue Processing', () => {
    it('should queue and process emails', async () => {
      const provider = new MockEmailProviderA(0, 0);
      const service = new EmailService([provider]);
      const message = createTestMessage();
      await service.queueEmail(message);
      expect(service.getQueueSize()).toBe(1);
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(service.getQueueSize()).toBe(0);
      const status = service.getEmailStatus(message.id);
      expect(status.status).toBe(EmailStatus.SENT);
    });
    it('should handle multiple queued emails', async () => {
      const provider = new MockEmailProviderA(0, 0);
      const service = new EmailService([provider]);
      const messages = [createTestMessage(), createTestMessage(), createTestMessage()];
      for (const message of messages) {
        await service.queueEmail(message);
      }
      expect(service.getQueueSize()).toBe(3);
      await new Promise(resolve => setTimeout(resolve, 500));
      expect(service.getQueueSize()).toBe(0);
      for (const message of messages) {
        const status = service.getEmailStatus(message.id);
        expect(status.status).toBe(EmailStatus.SENT);
      }
    });
  });
  describe('Provider Health', () => {
    it('should report provider health status', async () => {
      const providerA = new MockEmailProviderA();
      const providerB = new MockEmailProviderB();
      const service = new EmailService([providerA, providerB]);
      const healthStatus = await service.getProviderHealthStatus();
      expect(healthStatus).toHaveLength(2);
      expect(healthStatus[0].providerId).toBe('provider-a');
      expect(healthStatus[1].providerId).toBe('provider-b');
      expect(typeof healthStatus[0].isHealthy).toBe('boolean');
      expect(typeof healthStatus[1].isHealthy).toBe('boolean');
    });
  });
  describe('Utility Methods', () => {
    it('should reset rate limiter', () => {
      const provider = new MockEmailProviderA();
      const service = new EmailService([provider]);
      expect(() => service.resetRateLimit()).not.toThrow();
    });
    it('should reset circuit breakers', () => {
      const provider = new MockEmailProviderA();
      const service = new EmailService([provider]);
      expect(() => service.resetCircuitBreakers()).not.toThrow();
    });
    it('should return all email statuses', async () => {
      const provider = new MockEmailProviderA(0, 0);
      const service = new EmailService([provider]);
      const message1 = createTestMessage();
      const message2 = createTestMessage();
      await service.sendEmail(message1);
      await service.sendEmail(message2);
      const allStatuses = service.getAllEmailStatuses();
      expect(allStatuses).toHaveLength(2);
      expect(allStatuses.every(status => status.status === EmailStatus.SENT)).toBe(true);
    });
  });
});


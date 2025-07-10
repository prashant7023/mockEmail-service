const { EmailService } = require('./email-service');
const { MockEmailProviderA } = require('./providers/mock-provider-a');
const { MockEmailProviderB } = require('./providers/mock-provider-b');
const { TokenBucketRateLimiter } = require('./rate-limiter');
const { CircuitBreaker } = require('./circuit-breaker');
const { SimpleLogger } = require('./logger');
const { EmailStatus, CircuitBreakerState } = require('./types');
async function example() {
  const providerA = new MockEmailProviderA(0.1, 100);
  const providerB = new MockEmailProviderB(0.15, 200);
  const emailService = new EmailService([providerA, providerB], {
    maxRetries: 3,
    baseDelayMs: 1000,
    rateLimitPerMinute: 50
  });
  const message = {
    id: `email-${Date.now()}`,
    to: ['user@example.com'],
    from: 'sender@example.com',
    subject: 'Test Email',
    body: 'This is a test email message.'
  };
  try {
    const result = await emailService.sendEmail(message);
    console.log('Email sent successfully:', result);
    const status = emailService.getEmailStatus(message.id);
    console.log('Email status:', status);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
  const healthStatus = await emailService.getProviderHealthStatus();
  console.log('Provider health:', healthStatus);
}
if (require.main === module) {
  example().catch(console.error);
}
module.exports = {
  EmailService,
  MockEmailProviderA,
  MockEmailProviderB,
  TokenBucketRateLimiter,
  CircuitBreaker,
  SimpleLogger,
  EmailStatus,
  CircuitBreakerState,
  example
};


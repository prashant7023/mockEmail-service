const { EmailService } = require('./email-service');
const { MockEmailProviderA } = require('./providers/mock-provider-a');
const { MockEmailProviderB } = require('./providers/mock-provider-b');
const { TokenBucketRateLimiter } = require('./rate-limiter');
const { CircuitBreaker } = require('./circuit-breaker');
const { SimpleLogger } = require('./logger');
const { EmailStatus, CircuitBreakerState } = require('./types');

/**
 * Example usage of the EmailService
 */
async function example() {
  // Initialize providers
  const providerA = new MockEmailProviderA(0.1, 100); // 10% failure rate, 100ms latency
  const providerB = new MockEmailProviderB(0.15, 200); // 15% failure rate, 200ms latency

  // Initialize service
  const emailService = new EmailService([providerA, providerB], {
    maxRetries: 3,
    baseDelayMs: 1000,
    rateLimitPerMinute: 50
  });

  // Create email message
  const message = {
    id: `email-${Date.now()}`,
    to: ['user@example.com'],
    from: 'sender@example.com',
    subject: 'Test Email',
    body: 'This is a test email message.'
  };

  try {
    // Send email
    const result = await emailService.sendEmail(message);
    console.log('Email sent successfully:', result);

    // Check status
    const status = emailService.getEmailStatus(message.id);
    console.log('Email status:', status);

  } catch (error) {
    console.error('Failed to send email:', error);
  }

  // Get provider health
  const healthStatus = await emailService.getProviderHealthStatus();
  console.log('Provider health:', healthStatus);
}

// Run example if this file is executed directly
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

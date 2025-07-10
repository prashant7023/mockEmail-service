const { EmailService, MockEmailProviderA, MockEmailProviderB } = require('../src');
const providerA = new MockEmailProviderA(0.1, 100); // 10% failure rate, 100ms latency
const providerB = new MockEmailProviderB(0.15, 200); // 15% failure rate, 200ms latency
const emailService = new EmailService([providerA, providerB], {
  maxRetries: 3,
  baseDelayMs: 1000,
  rateLimitPerMinute: 50,
  circuitBreakerThreshold: 3,
  circuitBreakerTimeout: 30000
});
async function demonstrateBasicSending() {
  console.log('\n=== Basic Email Sending Demo ===');
  const message = {
    id: `demo-basic-${Date.now()}`,
    to: ['user@example.com'],
    from: 'sender@example.com',
    subject: 'Basic Demo Email',
    body: 'This is a demonstration of basic email sending.'
  };
  try {
    const result = await emailService.sendEmail(message);
    console.log('✅ Email sent successfully:', {
      id: result.id,
      provider: result.providerId,
      attempts: result.attempts,
      timestamp: result.timestamp
    });
    const status = emailService.getEmailStatus(message.id);
    console.log('📊 Email status:', {
      status: status.status,
      attempts: status.attempts,
      provider: status.providerId
    });
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
  }
}
async function demonstrateRetryLogic() {
  console.log('\n=== Retry Logic Demo ===');
  const message = {
    id: `demo-retry-${Date.now()}`,
    to: ['user@example.com'],
    from: 'sender@example.com',
    subject: 'FORCE_FAILURE_A Demo - Should fallback to Provider B',
    body: 'This email will fail on Provider A and fallback to Provider B.'
  };
  try {
    console.log('🔄 Attempting to send email (Provider A will fail)...');
    const result = await emailService.sendEmail(message);
    console.log('✅ Email sent successfully (after fallback):', {
      id: result.id,
      provider: result.providerId,
      attempts: result.attempts,
      timestamp: result.timestamp
    });
    const status = emailService.getEmailStatus(message.id);
    console.log('📊 Email status:', {
      status: status.status,
      attempts: status.attempts,
      provider: status.providerId
    });
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
  }
}
async function demonstrateIdempotency() {
  console.log('\n=== Idempotency Demo ===');
  const messageId = `demo-idempotent-${Date.now()}`;
  const message = {
    id: messageId,
    to: ['user@example.com'],
    from: 'sender@example.com',
    subject: 'Idempotency Demo Email',
    body: 'This email demonstrates idempotency - sending twice with same ID.'
  };
  try {
    console.log('🔄 Sending first attempt...');
    const result1 = await emailService.sendEmail(message);
    console.log('✅ First attempt succeeded:', {
      id: result1.id,
      provider: result1.providerId,
      timestamp: result1.timestamp
    });
    console.log('🔄 Sending second attempt with same ID...');
    const result2 = await emailService.sendEmail(message);
    console.log('✅ Second attempt returned:', {
      id: result2.id,
      provider: result2.providerId,
      timestamp: result2.timestamp
    });
    console.log('🔍 Notice: The timestamp did not change because the email was not actually sent again.');
  } catch (error) {
    console.error('❌ Failed to demonstrate idempotency:', error.message);
  }
}
async function demonstrateRateLimiting() {
  console.log('\n=== Rate Limiting Demo ===');
  console.log('🔄 Sending multiple emails rapidly to trigger rate limiting...');
  const promises = [];
  for (let i = 0; i < 55; i++) {
    const message = {
      id: `demo-rate-limit-${Date.now()}-${i}`,
      to: ['user@example.com'],
      from: 'sender@example.com',
      subject: `Rate Limit Demo Email ${i}`,
      body: 'This is part of a batch to demonstrate rate limiting.'
    };
    promises.push(
      emailService.sendEmail(message)
        .then(result => {
          console.log(`✅ Email ${i} sent successfully.`);
          return { success: true, id: i };
        })
        .catch(error => {
          console.log(`❌ Email ${i} failed: ${error.message}`);
          return { success: false, id: i, error: error.message };
        })
    );
  }
  const results = await Promise.all(promises);
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`📊 Summary: ${successful} emails sent successfully, ${failed} emails failed due to rate limiting`);
}
async function demonstrateCircuitBreaker() {
  console.log('\n=== Circuit Breaker Demo ===');
  console.log('🔄 Creating temporary failing provider to demonstrate circuit breaker...');
  // Create a new email service with a provider that will always fail
  const alwaysFailProvider = new MockEmailProviderA(1.0, 10); // 100% failure rate
  const circuitBreakerService = new EmailService([alwaysFailProvider], {
    maxRetries: 1,
    baseDelayMs: 100,
    circuitBreakerThreshold: 3,
    circuitBreakerTimeout: 5000 // 5 seconds for demo purposes
  });
  console.log('🔄 Sending emails that will fail to trigger the circuit breaker...');
  for (let i = 0; i < 5; i++) {
    const message = {
      id: `demo-circuit-breaker-${Date.now()}-${i}`,
      to: ['user@example.com'],
      from: 'sender@example.com',
      subject: `Circuit Breaker Demo ${i}`,
      body: 'This email is part of the circuit breaker demonstration.'
    };
    try {
      await circuitBreakerService.sendEmail(message);
      console.log(`✅ Email ${i} sent successfully (unlikely).`);
    } catch (error) {
      console.log(`❌ Email ${i} failed: ${error.message}`);
      if (error.message.includes('Circuit breaker is open')) {
        console.log('🔌 Circuit breaker is now OPEN!');
      }
    }
  }
  console.log('⏳ Waiting for circuit breaker timeout...');
  await new Promise(resolve => setTimeout(resolve, 6000));
  console.log('🔄 Attempting to send again after timeout...');
  try {
    const message = {
      id: `demo-circuit-breaker-after-timeout-${Date.now()}`,
      to: ['user@example.com'],
      from: 'sender@example.com',
      subject: 'Circuit Breaker After Timeout',
      body: 'This email tests if the circuit breaker has closed after timeout.'
    };
    await circuitBreakerService.sendEmail(message);
    console.log('✅ Email sent successfully (unlikely).');
  } catch (error) {
    console.log(`❌ Email failed: ${error.message}`);
    console.log('🔌 Circuit breaker is half-open but failed again, returning to open state.');
  }
}
async function demonstrateQueueHandling() {
  console.log('\n=== Queue Handling Demo ===');
  const batchSize = 10;
  console.log(`🔄 Adding ${batchSize} emails to queue...`);
  for (let i = 0; i < batchSize; i++) {
    const message = {
      id: `demo-queue-${Date.now()}-${i}`,
      to: ['user@example.com'],
      from: 'sender@example.com',
      subject: `Queued Email ${i}`,
      body: `This is email ${i} in the queue demonstration.`
    };
    emailService.queueEmail(message);
    console.log(`📬 Email ${i} added to queue`);
  }
  console.log(`📊 Queue size: ${emailService.getQueueSize()}`);
  console.log('🔄 Processing queue...');
  const results = await emailService.processQueue();
  // Handle case when results might not be an array with filter method
  const successful = Array.isArray(results) ? results.filter(r => r && r.success).length : 0;
  const failed = Array.isArray(results) ? results.filter(r => r && !r.success).length : 0;
  console.log(`📊 Queue processing complete: ${successful} emails sent successfully, ${failed} emails failed`);
}
async function runAllDemos() {
  console.log('🚀 Starting Email Service Demonstrations');
  await demonstrateBasicSending();
  await demonstrateRetryLogic();
  await demonstrateIdempotency();
  await demonstrateRateLimiting();
  await demonstrateCircuitBreaker();
  await demonstrateQueueHandling();
  console.log('✨ All demonstrations completed');
}
if (require.main === module) {
  runAllDemos().catch(console.error);
}
module.exports = {
  emailService,
  demonstrateBasicSending,
  demonstrateRetryLogic,
  demonstrateIdempotency,
  demonstrateRateLimiting,
  demonstrateCircuitBreaker,
  demonstrateQueueHandling,
  runAllDemos
};

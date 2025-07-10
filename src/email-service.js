const { EmailStatus } = require('./types');
const { TokenBucketRateLimiter } = require('./rate-limiter');
const { CircuitBreaker } = require('./circuit-breaker');
const { SimpleLogger } = require('./logger');
class EmailService {
  constructor(providers, config = {}, logger) {
    if (!providers || providers.length === 0) {
      throw new Error('At least one email provider is required');
    }
    this.providers = providers;
    this.config = {
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      rateLimitPerMinute: 100,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000,
      ...config
    };
    this.rateLimiter = new TokenBucketRateLimiter(
      this.config.rateLimitPerMinute,
      this.config.rateLimitPerMinute
    );
    this.circuitBreakers = new Map();
    this.providers.forEach(provider => {
      this.circuitBreakers.set(
        provider.id,
        new CircuitBreaker(
          this.config.circuitBreakerThreshold,
          this.config.circuitBreakerTimeout
        )
      );
    });
    this.logger = logger || new SimpleLogger();
    this.trackingStore = new Map();
    this.sentEmails = new Set(); // For idempotency
    this.emailQueue = [];
    this.isProcessingQueue = false;
  }
  async sendEmail(message) {
    if (this.sentEmails.has(message.id)) {
      this.logger.info(`Email ${message.id} already sent (idempotency check)`);
      const tracking = this.trackingStore.get(message.id);
      if (tracking && tracking.status === EmailStatus.SENT) {
        return {
          id: message.id,
          success: true,
          providerId: tracking.providerId,
          timestamp: tracking.sentAt,
          attempts: tracking.attempts
        };
      }
    }
    if (!this.rateLimiter.isAllowed()) {
      const error = 'Rate limit exceeded';
      this.logger.warn(error, { emailId: message.id });
      throw new Error(error);
    }
    const tracking = {
      id: message.id,
      status: EmailStatus.PENDING,
      attempts: 0,
      lastAttempt: new Date(),
      createdAt: new Date()
    };
    this.trackingStore.set(message.id, tracking);
    this.logger.info(`Starting email send process`, { emailId: message.id });
    let lastError = null;
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      tracking.attempts = attempt + 1;
      tracking.lastAttempt = new Date();
      tracking.status = attempt > 0 ? EmailStatus.RETRYING : EmailStatus.PENDING;
      try {
        const result = await this.attemptSendWithFallback(message);
        tracking.status = EmailStatus.SENT;
        tracking.sentAt = new Date();
        tracking.providerId = result.providerId;
        this.sentEmails.add(message.id);
        this.logger.info(`Email sent successfully`, { 
          emailId: message.id, 
          provider: result.providerId,
          attempts: tracking.attempts 
        });
        return {
          ...result,
          attempts: tracking.attempts
        };
      } catch (error) {
        lastError = error;
        tracking.error = lastError.message;
        this.logger.warn(`Email send attempt ${attempt + 1} failed`, {
          emailId: message.id,
          error: lastError.message,
          attempt: attempt + 1,
          maxRetries: this.config.maxRetries
        });
        if (attempt < this.config.maxRetries) {
          const delay = this.calculateBackoffDelay(attempt);
          this.logger.debug(`Waiting ${delay}ms before retry`, { emailId: message.id });
          await this.delay(delay);
        }
      }
    }
    tracking.status = EmailStatus.FAILED;
    this.logger.error(`Email failed after all attempts`, {
      emailId: message.id,
      attempts: tracking.attempts,
      finalError: lastError?.message
    });
    throw new Error(`Failed to send email after ${this.config.maxRetries + 1} attempts: ${lastError?.message}`);
  }
  async queueEmail(message) {
    this.emailQueue.push(message);
    this.logger.info(`Email queued`, { emailId: message.id, queueSize: this.emailQueue.length });
    if (!this.isProcessingQueue) {
      setTimeout(() => this.processQueue(), 50);
    }
  }
  getEmailStatus(emailId) {
    return this.trackingStore.get(emailId);
  }
  getAllEmailStatuses() {
    return Array.from(this.trackingStore.values());
  }
  async getProviderHealthStatus() {
    const statuses = await Promise.all(
      this.providers.map(async provider => {
        const isHealthy = await provider.isHealthy().catch(() => false);
        const circuitBreaker = this.circuitBreakers.get(provider.id);
        return {
          providerId: provider.id,
          isHealthy,
          circuitBreakerState: circuitBreaker.getState()
        };
      })
    );
    return statuses;
  }
  resetRateLimit() {
    this.rateLimiter.reset();
    this.logger.info('Rate limiter reset');
  }
  resetCircuitBreakers() {
    this.circuitBreakers.forEach(cb => cb.reset());
    this.logger.info('All circuit breakers reset');
  }
  getQueueSize() {
    return this.emailQueue.length;
  }
  dequeueEmail() {
    return this.emailQueue.shift();
  }
  async attemptSendWithFallback(message) {
    let lastError = null;
    for (const provider of this.providers) {
      const circuitBreaker = this.circuitBreakers.get(provider.id);
      try {
        const result = await circuitBreaker.execute(async () => {
          this.logger.debug(`Attempting send with provider ${provider.id}`, { emailId: message.id });
          return await provider.send(message);
        });
        this.logger.debug(`Provider ${provider.id} succeeded`, { emailId: message.id });
        return result;
      } catch (error) {
        lastError = error;
        this.logger.debug(`Provider ${provider.id} failed`, { 
          emailId: message.id, 
          error: lastError.message 
        });
        continue;
      }
    }
    throw lastError || new Error('All providers failed');
  }
  calculateBackoffDelay(attempt) {
    const exponentialDelay = this.config.baseDelayMs * Math.pow(2, attempt);
    const jitterDelay = exponentialDelay * (0.5 + Math.random() * 0.5); // Add jitter
    return Math.min(jitterDelay, this.config.maxDelayMs);
  }
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  async processQueue() {
    if (this.isProcessingQueue) return [];
    this.isProcessingQueue = true;
    this.logger.info('Starting queue processing');
    
    const results = [];
    while (this.emailQueue.length > 0) {
      const message = this.emailQueue.shift();
      try {
        const result = await this.sendEmail(message);
        results.push({ success: true, id: message.id, result });
      } catch (error) {
        this.logger.error(`Failed to process queued email`, {
          emailId: message.id,
          error: error.message
        });
        results.push({ success: false, id: message.id, error: error.message });
      }
      await this.delay(100);
    }
    this.isProcessingQueue = false;
    this.logger.info('Queue processing completed');
    return results;
  }
}
module.exports = { EmailService };


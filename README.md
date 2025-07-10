# Resilient Email Service

A robust and resilient email sending service built with TypeScript that implements retry logic, fallback mechanisms, rate limiting, and idempotency features.

## Features

✅ **Resilient Email Delivery**
- Retry mechanism with exponential backoff and jitter
- Automatic fallback between multiple email providers
- Circuit breaker pattern to prevent cascading failures

✅ **Reliability & Performance**
- Idempotency to prevent duplicate email sends
- Token bucket rate limiting
- Email queue system for background processing
- Comprehensive status tracking

✅ **Monitoring & Observability**
- Provider health status monitoring
- Detailed email tracking and status reporting
- Structured logging with metadata
- Circuit breaker state monitoring

✅ **Developer Experience**
- Full TypeScript support with strong typing
- Comprehensive unit test coverage
- Clean, SOLID architecture
- Mock providers for testing

## Architecture

```
EmailService
├── Providers (MockEmailProviderA, MockEmailProviderB)
├── Circuit Breakers (per provider)
├── Rate Limiter (Token Bucket)
├── Logger (Simple Console Logger)
├── Tracking Store (In-memory)
└── Email Queue (In-memory)
```

## Quick Start

### 🐳 Docker (Recommended)

The fastest way to get started is using Docker:

```bash
# Pull and run from Docker Hub
docker pull prashant7023/resilient-email-service:latest
docker run -p 3001:3001 prashant7023/resilient-email-service:latest
```

Access the web interface at: http://localhost:3001

### 📦 From Source

```bash
npm install
npm run build
npm test
npm run dev
```

### Docker Compose

For a complete setup with optional services:

```bash
# Clone the repository
git clone <repository-url>
cd resilient-email-service

# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🌐 Docker Hub

The application is available as a Docker image:
- **Repository**: `prashant7023/resilient-email-service`
- **Tags**: `latest`, `v1.0.0`
- **Size**: ~188MB (Alpine-based)
- **URL**: https://hub.docker.com/r/prashant7023/resilient-email-service

### Environment Variables

Configure the container using environment variables:

```bash
docker run -p 3001:3001 \
  -e NODE_ENV=production \
  -e PORT=3001 \
  -e MAX_RETRIES=5 \
  -e RATE_LIMIT_PER_MINUTE=100 \
  -e CIRCUIT_BREAKER_THRESHOLD=3 \
  -e CIRCUIT_BREAKER_TIMEOUT=30000 \
  prashant7023/resilient-email-service:latest
```

## Usage

### Basic Email Sending

```typescript
import { EmailService, MockEmailProviderA, MockEmailProviderB, EmailMessage } from './src';

// Initialize providers
const providerA = new MockEmailProviderA(0.1, 100); // 10% failure rate, 100ms latency
const providerB = new MockEmailProviderB(0.15, 200); // 15% failure rate, 200ms latency

// Create service with custom configuration
const emailService = new EmailService([providerA, providerB], {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  rateLimitPerMinute: 100,
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 60000
});

// Send an email
const message: EmailMessage = {
  id: 'unique-email-id',
  to: ['recipient@example.com'],
  from: 'sender@example.com',
  subject: 'Hello World',
  body: 'This is a test email.'
};

try {
  const result = await emailService.sendEmail(message);
  console.log('Email sent:', result);
} catch (error) {
  console.error('Failed to send email:', error);
}
```

### Queue-based Processing

```typescript
// Queue emails for background processing
await emailService.queueEmail(message1);
await emailService.queueEmail(message2);
await emailService.queueEmail(message3);

console.log('Queue size:', emailService.getQueueSize());
```

### Status Tracking

```typescript
// Get email status
const status = emailService.getEmailStatus('unique-email-id');
console.log('Email status:', status);

// Get all email statuses
const allStatuses = emailService.getAllEmailStatuses();
console.log('All emails:', allStatuses);
```

### Provider Health Monitoring

```typescript
// Check provider health
const healthStatus = await emailService.getProviderHealthStatus();
console.log('Provider health:', healthStatus);
```

## Configuration

The `EmailServiceConfig` interface allows you to customize the behavior:

```typescript
interface EmailServiceConfig {
  maxRetries: number;              // Maximum retry attempts (default: 3)
  baseDelayMs: number;             // Base delay for exponential backoff (default: 1000ms)
  maxDelayMs: number;              // Maximum delay between retries (default: 30000ms)
  rateLimitPerMinute: number;      // Rate limit for emails per minute (default: 100)
  circuitBreakerThreshold: number; // Failures before opening circuit (default: 5)
  circuitBreakerTimeout: number;   // Circuit breaker timeout in ms (default: 60000ms)
}
```

## Core Components

### EmailService

The main service class that orchestrates email sending with resilience features:

- **Retry Logic**: Exponential backoff with jitter
- **Fallback**: Automatic provider switching on failure
- **Idempotency**: Prevents duplicate sends using email IDs
- **Rate Limiting**: Token bucket algorithm
- **Circuit Breaker**: Per-provider circuit breakers
- **Queue Processing**: Background email processing

### Mock Providers

Two mock email providers with configurable failure rates:

- **MockEmailProviderA**: Simulates a reliable provider (10% default failure rate)
- **MockEmailProviderB**: Simulates a less reliable provider (15% default failure rate)

Both providers support:
- Configurable failure rates and latency
- Forced failures for testing (via email subject)
- Health status reporting
- Provider downtime simulation (Provider B)

### Rate Limiter

Token bucket implementation with:
- Configurable capacity and refill rate
- Automatic token refilling over time
- Manual reset capability

### Circuit Breaker

Per-provider circuit breakers with:
- Configurable failure threshold
- Automatic recovery after timeout
- Three states: CLOSED, OPEN, HALF_OPEN

## Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm test -- --coverage
```

### Test Coverage

The test suite covers:
- ✅ Email sending with success and failure scenarios
- ✅ Retry logic with exponential backoff
- ✅ Provider fallback mechanisms
- ✅ Idempotency checks
- ✅ Rate limiting behavior
- ✅ Circuit breaker functionality
- ✅ Queue processing
- ✅ Status tracking
- ✅ Provider health monitoring
- ✅ Error handling and edge cases

## Design Principles

### SOLID Principles

- **Single Responsibility**: Each class has a single, well-defined purpose
- **Open/Closed**: Easy to extend with new providers or features
- **Liskov Substitution**: Providers are interchangeable
- **Interface Segregation**: Small, focused interfaces
- **Dependency Inversion**: Depends on abstractions, not concretions

### Error Handling

- Comprehensive error handling at all levels
- Graceful degradation with fallback mechanisms
- Detailed error logging and tracking
- Circuit breaker protection against cascading failures

### Testability

- Dependency injection for easy testing
- Mock providers for isolated testing
- Comprehensive unit tests with high coverage
- Time-based functionality is testable

## Assumptions and Decisions

### Technical Decisions

1. **In-Memory Storage**: Email tracking and queue use in-memory storage for simplicity. In production, consider using Redis or a database.

2. **Mock Providers**: Real email providers (SendGrid, AWS SES) are simulated with mock implementations that have configurable failure rates.

3. **Exponential Backoff**: Uses exponential backoff with jitter to prevent thundering herd problems.

4. **Circuit Breaker**: Per-provider circuit breakers prevent cascading failures and allow for automatic recovery.

5. **Rate Limiting**: Token bucket algorithm provides smooth rate limiting with burst capability.

### Assumptions

1. **Email IDs**: Emails have unique IDs for idempotency tracking
2. **Provider Independence**: Email providers are independent and their failures are uncorrelated
3. **Immediate Processing**: Emails are processed immediately unless queued
4. **Single Instance**: Service runs in a single instance (no distributed coordination)

## Future Enhancements

Potential improvements for production use:

1. **Persistent Storage**: Replace in-memory stores with Redis/database
2. **Distributed Queue**: Use message queues like RabbitMQ or AWS SQS
3. **Metrics & Monitoring**: Add Prometheus metrics and alerting
4. **Real Providers**: Integrate with actual email services
5. **Configuration Management**: External configuration management
6. **Webhooks**: Support for delivery status webhooks
7. **Template Support**: Email template management
8. **Batch Processing**: Bulk email sending capabilities

## API Reference

### EmailService

#### Methods

- `sendEmail(message: EmailMessage): Promise<EmailResult>`
- `queueEmail(message: EmailMessage): Promise<void>`
- `getEmailStatus(emailId: string): EmailTrackingInfo | undefined`
- `getAllEmailStatuses(): EmailTrackingInfo[]`
- `getProviderHealthStatus(): Promise<ProviderHealthStatus[]>`
- `resetRateLimit(): void`
- `resetCircuitBreakers(): void`
- `getQueueSize(): number`

### Interfaces

See [types.ts](./src/types.ts) for complete interface definitions.

## License

MIT License - see LICENSE file for details.

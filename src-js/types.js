/**
 * Email status enumeration
 */
const EmailStatus = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  RETRYING: 'retrying'
};

/**
 * Circuit breaker state
 */
const CircuitBreakerState = {
  CLOSED: 'closed',
  OPEN: 'open',
  HALF_OPEN: 'half_open'
};

module.exports = {
  EmailStatus,
  CircuitBreakerState
};

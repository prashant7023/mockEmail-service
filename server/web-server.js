const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const { EmailService, MockEmailProviderA, MockEmailProviderB } = require('../src');

const PORT = process.env.PORT || 3001;

const providerA = new MockEmailProviderA(0.1, 100);
const providerB = new MockEmailProviderB(0.15, 200);

const emailService = new EmailService([providerA, providerB], {
  maxRetries: 3,
  baseDelayMs: 1000,
  rateLimitPerMinute: 50,
  circuitBreakerThreshold: 3,
  circuitBreakerTimeout: 30000
});

// Demo functions from mail-server.js
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
    return { success: true, result, status };
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    return { success: false, error: error.message };
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
    return { success: true, result, status };
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    return { success: false, error: error.message };
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
    return {
      success: true,
      firstAttempt: result1,
      secondAttempt: result2,
      isSameTimestamp: result1.timestamp === result2.timestamp
    };
  } catch (error) {
    console.error('❌ Failed to demonstrate idempotency:', error.message);
    return { success: false, error: error.message };
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
  
  return {
    success: true,
    totalAttempted: results.length,
    successful,
    failed,
    failureRate: (failed / results.length * 100).toFixed(1) + '%'
  };
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
  const results = [];
  let circuitOpened = false;
  
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
      results.push({ attempt: i, success: true });
      console.log(`✅ Email ${i} sent successfully (unlikely).`);
    } catch (error) {
      results.push({ attempt: i, success: false, error: error.message });
      console.log(`❌ Email ${i} failed: ${error.message}`);
      if (error.message.includes('Circuit breaker is open')) {
        console.log('🔌 Circuit breaker is now OPEN!');
        circuitOpened = true;
      }
    }
  }
  
  console.log('⏳ Waiting for circuit breaker timeout...');
  await new Promise(resolve => setTimeout(resolve, 6000));
  console.log('🔄 Attempting to send again after timeout...');
  let afterTimeoutResult;
  
  try {
    const message = {
      id: `demo-circuit-breaker-after-timeout-${Date.now()}`,
      to: ['user@example.com'],
      from: 'sender@example.com',
      subject: 'Circuit Breaker After Timeout',
      body: 'This email tests if the circuit breaker has closed after timeout.'
    };
    await circuitBreakerService.sendEmail(message);
    afterTimeoutResult = { success: true };
    console.log('✅ Email sent successfully (unlikely).');
  } catch (error) {
    afterTimeoutResult = { success: false, error: error.message };
    console.log(`❌ Email failed: ${error.message}`);
    console.log('🔌 Circuit breaker is half-open but failed again, returning to open state.');
  }
  
  return {
    success: true,
    circuitOpened,
    attemptResults: results,
    afterTimeout: afterTimeoutResult
  };
}

async function demonstrateQueueHandling() {
  console.log('\n=== Queue Handling Demo ===');
  const batchSize = 10;
  console.log(`🔄 Adding ${batchSize} emails to queue...`);
  
  // Clear any existing queue
  while (emailService.getQueueSize() > 0) {
    emailService.dequeueEmail();
  }
  
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
  
  const queueSizeBefore = emailService.getQueueSize();
  console.log(`📊 Queue size: ${queueSizeBefore}`);
  
  console.log('🔄 Processing queue...');
  const results = await emailService.processQueue();
  
  // Handle case when results might not be an array with filter method
  const successful = Array.isArray(results) ? results.filter(r => r && r.success).length : 0;
  const failed = Array.isArray(results) ? results.filter(r => r && !r.success).length : 0;
  console.log(`📊 Queue processing complete: ${successful} emails sent successfully, ${failed} emails failed`);
  
  return {
    success: true,
    queueSizeBefore,
    queueSizeAfter: emailService.getQueueSize(),
    successful,
    failed,
    totalProcessed: Array.isArray(results) ? results.length : 0
  };
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // API endpoints
  if (pathname.startsWith('/api/')) {
    handleApiRequest(req, res, pathname);
    return;
  }

  // Serve static files
  if (pathname.startsWith('/public/') || pathname.startsWith('/js/') || pathname.startsWith('/css/')) {
    // For paths like /js/ or /css/, add the /public prefix
    const adjustedPath = pathname.startsWith('/public/') 
      ? pathname 
      : `/public${pathname}`;
    
    const filePath = path.join(__dirname, '..', adjustedPath);
    const ext = path.extname(filePath);
    const contentType = getContentType(ext);

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404);
        res.end('File not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
    return;
  }

  // Serve HTML pages
  if (pathname === '/' || pathname === '/index.html') {
    fs.readFile(path.join(__dirname, '..', 'views', 'index.ejs'), 'utf8', (err, template) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading template');
        return;
      }

      const html = ejs.render(template, {
        title: 'Resilient Email Service',
        description: 'A robust email sending service with retry logic, fallback, and more.'
      });

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    });
    return;
  }

  // 404 for any other route
  res.writeHead(404);
  res.end('Not Found');
});

function getContentType(ext) {
  switch (ext) {
    case '.js':
      return 'text/javascript';
    case '.css':
      return 'text/css';
    case '.json':
      return 'application/json';
    case '.png':
      return 'image/png';
    case '.jpg':
      return 'image/jpg';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'text/plain';
  }
}

async function handleApiRequest(req, res, pathname) {
  res.setHeader('Content-Type', 'application/json');

  if (pathname === '/api/demos/basic' && req.method === 'POST') {
    const result = await demonstrateBasicSending();
    res.end(JSON.stringify(result));
  } else if (pathname === '/api/demos/retry' && req.method === 'POST') {
    const result = await demonstrateRetryLogic();
    res.end(JSON.stringify(result));
  } else if (pathname === '/api/demos/idempotency' && req.method === 'POST') {
    const result = await demonstrateIdempotency();
    res.end(JSON.stringify(result));
  } else if (pathname === '/api/demos/rate-limiting' && req.method === 'POST') {
    const result = await demonstrateRateLimiting();
    res.end(JSON.stringify(result));
  } else if (pathname === '/api/demos/circuit-breaker' && req.method === 'POST') {
    const result = await demonstrateCircuitBreaker();
    res.end(JSON.stringify(result));
  } else if (pathname === '/api/demos/queue' && req.method === 'POST') {
    const result = await demonstrateQueueHandling();
    res.end(JSON.stringify(result));
  } else if (pathname === '/api/email/status' && req.method === 'GET') {
    const parsedUrl = url.parse(req.url, true);
    const id = parsedUrl.query.id;
    
    if (!id) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Email ID is required' }));
      return;
    }
    
    const status = emailService.getEmailStatus(id);
    if (!status) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Email not found' }));
      return;
    }
    
    res.end(JSON.stringify(status));
  } else if (pathname === '/api/email/send' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const messageData = JSON.parse(body);
        
        if (!messageData.to || !messageData.from || !messageData.subject || !messageData.body) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Missing required email fields' }));
          return;
        }
        
        const message = {
          id: messageData.id || `email-${Date.now()}`,
          to: Array.isArray(messageData.to) ? messageData.to : [messageData.to],
          from: messageData.from,
          subject: messageData.subject,
          body: messageData.body
        };
        
        try {
          const result = await emailService.sendEmail(message);
          res.end(JSON.stringify({ 
            success: true, 
            id: result.id,
            provider: result.providerId,
            attempts: result.attempts,
            timestamp: result.timestamp
          }));
        } catch (error) {
          res.writeHead(500);
          res.end(JSON.stringify({ 
            success: false, 
            error: error.message 
          }));
        }
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON data' }));
      }
    });
  } else if (pathname === '/api/email/queue' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const messageData = JSON.parse(body);
        
        if (!messageData.to || !messageData.from || !messageData.subject || !messageData.body) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Missing required email fields' }));
          return;
        }
        
        const message = {
          id: messageData.id || `email-${Date.now()}`,
          to: Array.isArray(messageData.to) ? messageData.to : [messageData.to],
          from: messageData.from,
          subject: messageData.subject,
          body: messageData.body
        };
        
        emailService.queueEmail(message);
        res.end(JSON.stringify({ 
          success: true, 
          id: message.id,
          queueSize: emailService.getQueueSize()
        }));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON data' }));
      }
    });
  } else if (pathname === '/api/queue/process' && req.method === 'POST') {
    try {
      const queueSizeBefore = emailService.getQueueSize();
      const results = await emailService.processQueue();
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      res.end(JSON.stringify({
        success: true,
        queueSizeBefore,
        queueSizeAfter: emailService.getQueueSize(),
        processed: results.length,
        successful,
        failed
      }));
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Failed to process queue' }));
    }
  } else if (pathname === '/api/status' && req.method === 'GET') {
    // Get service status
    const allStatuses = emailService.getAllEmailStatuses();
    const statusCounts = {
      sent: allStatuses.filter(s => s.status === 'sent').length,
      failed: allStatuses.filter(s => s.status === 'failed').length,
      pending: allStatuses.filter(s => s.status === 'pending').length,
      retrying: allStatuses.filter(s => s.status === 'retrying').length
    };
    
    res.end(JSON.stringify({
      totalEmails: allStatuses.length,
      statusCounts,
      queueSize: emailService.getQueueSize(),
      recentEmails: allStatuses.slice(-10) // Last 10 emails
    }));
  } else if (pathname === '/api/reset' && req.method === 'POST') {
    // Reset rate limiter
    emailService.resetRateLimit();
    res.end(JSON.stringify({ success: true, message: 'Rate limiter reset' }));
  } else if (pathname === '/api/reset-circuit-breakers' && req.method === 'POST') {
    // Reset circuit breakers
    emailService.resetCircuitBreakers();
    res.end(JSON.stringify({ success: true, message: 'Circuit breakers reset' }));
  } else if (pathname === '/api/health' && req.method === 'GET') {
    // Get provider health status
    try {
      const healthStatus = await emailService.getProviderHealthStatus();
      res.end(JSON.stringify(healthStatus));
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Failed to get health status' }));
    }
  } else if (pathname.startsWith('/api/demo/') && req.method === 'POST') {
    // Handle demo endpoints with different paths
    const demoType = pathname.replace('/api/demo/', '');
    
    try {
      let result;
      switch (demoType) {
        case 'basic':
          result = await demonstrateBasicSending();
          break;
        case 'retry':
          result = await demonstrateRetryLogic();
          break;
        case 'idempotency':
          result = await demonstrateIdempotency();
          break;
        case 'rate-limiting':
        case 'rate-limit':  // Support both variations
          result = await demonstrateRateLimiting();
          break;
        case 'circuit-breaker':
          result = await demonstrateCircuitBreaker();
          break;
        case 'queue':
          result = await demonstrateQueueHandling();
          break;
        case 'full':
          // Run all demos in sequence
          console.log('🚀 Running Full Demo Suite...');
          const basicResult = await demonstrateBasicSending();
          const retryResult = await demonstrateRetryLogic();
          const idempotencyResult = await demonstrateIdempotency();
          const rateLimitResult = await demonstrateRateLimiting();
          const circuitBreakerResult = await demonstrateCircuitBreaker();
          const queueResult = await demonstrateQueueHandling();
          
          result = {
            success: true,
            message: 'All demos completed successfully',
            results: {
              basic: basicResult,
              retry: retryResult,
              idempotency: idempotencyResult,
              rateLimit: rateLimitResult,
              circuitBreaker: circuitBreakerResult,
              queue: queueResult
            }
          };
          break;
        default:
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Demo not found' }));
          return;
      }
      res.end(JSON.stringify(result));
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: error.message }));
    }
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  }
}

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log('Email service ready with the following configuration:');
  console.log('- Max retries:', emailService.config.maxRetries);
  console.log('- Base delay:', emailService.config.baseDelayMs, 'ms');
  console.log('- Rate limit:', emailService.config.rateLimitPerMinute, 'emails per minute');
  console.log('- Circuit breaker threshold:', emailService.config.circuitBreakerThreshold, 'failures');
  console.log('- Circuit breaker timeout:', emailService.config.circuitBreakerTimeout / 1000, 'seconds');
});

module.exports = { 
  server, 
  emailService,
  demonstrateBasicSending,
  demonstrateRetryLogic,
  demonstrateIdempotency,
  demonstrateRateLimiting,
  demonstrateCircuitBreaker,
  demonstrateQueueHandling
};

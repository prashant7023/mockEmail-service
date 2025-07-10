document.getElementById('emailForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const emailData = Object.fromEntries(formData);
    
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <div class="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md">
            <div class="flex items-center">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-800 mr-2"></div>
                Sending email...
            </div>
        </div>
    `;
    
    try {
        const response = await fetch('/api/email/send', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(emailData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            resultDiv.innerHTML = `
                <div class="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
                    <strong class="font-medium">✅ Email sent successfully!</strong><br>
                    <span class="text-sm">
                        ID: ${result.id}<br>
                        Provider: ${result.provider}<br>
                        Attempts: ${result.attempts}
                    </span>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
                    <strong class="font-medium">❌ Failed to send email:</strong><br>
                    <span class="text-sm">${result.error}</span>
                </div>
            `;
        }
    } catch (error) {
        resultDiv.innerHTML = `
            <div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
                <strong class="font-medium">❌ Error:</strong><br>
                <span class="text-sm">${error.message}</span>
            </div>
        `;
    }
    
    // Auto-refresh status after sending
    setTimeout(loadStatus, 1000);
});

// Load service status
async function loadStatus() {
    const statusDiv = document.getElementById('status');
    try {
        const response = await fetch('/api/status');
        const status = await response.json();
        
        statusDiv.innerHTML = `
            <div class="space-y-4">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="bg-blue-50 p-3 rounded-md text-center">
                        <div class="text-2xl font-bold text-blue-600">${status.totalEmails}</div>
                        <div class="text-sm text-blue-800">Total Emails</div>
                    </div>
                    <div class="bg-green-50 p-3 rounded-md text-center">
                        <div class="text-2xl font-bold text-green-600">${status.statusCounts.sent || 0}</div>
                        <div class="text-sm text-green-800">Sent</div>
                    </div>
                    <div class="bg-red-50 p-3 rounded-md text-center">
                        <div class="text-2xl font-bold text-red-600">${status.statusCounts.failed || 0}</div>
                        <div class="text-sm text-red-800">Failed</div>
                    </div>
                    <div class="bg-yellow-50 p-3 rounded-md text-center">
                        <div class="text-2xl font-bold text-yellow-600">${status.queueSize}</div>
                        <div class="text-sm text-yellow-800">Queue Size</div>
                    </div>
                </div>
                
                ${status.recentEmails.length > 0 ? `
                    <div>
                        <h4 class="font-medium text-gray-800 mb-2">Recent Emails:</h4>
                        <div class="space-y-2">
                            ${status.recentEmails.slice().reverse().map(email => `
                                <div class="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                                    <span class="font-mono text-xs">${email.id}</span>
                                    <span class="px-2 py-1 rounded text-xs ${
                                        email.status === 'sent' ? 'bg-green-100 text-green-800' :
                                        email.status === 'failed' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }">${email.status}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    } catch (error) {
        statusDiv.innerHTML = `
            <div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
                Error loading status: ${error.message}
            </div>
        `;
    }
}

// Reset service
async function resetService() {
    try {
        await fetch('/api/reset', {method: 'POST'});
        showNotification('Rate limit reset successfully!', 'success');
        loadStatus();
    } catch (error) {
        showNotification('Error resetting service: ' + error.message, 'error');
    }
}

// Reset circuit breakers
async function resetCircuitBreakers() {
    try {
        await fetch('/api/reset-circuit-breakers', {method: 'POST'});
        showNotification('Circuit breakers reset successfully!', 'success');
        loadStatus();
    } catch (error) {
        showNotification('Error resetting circuit breakers: ' + error.message, 'error');
    }
}

// Get provider health
async function getHealth() {
    try {
        const response = await fetch('/api/health');
        const health = await response.json();
        
        const healthStatus = Object.entries(health).map(([provider, status]) => 
            `${provider}: ${status.isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`
        ).join('\\n');
        
        showNotification('Provider Health:\\n' + healthStatus, 'info');
    } catch (error) {
        showNotification('Error checking health: ' + error.message, 'error');
    }
}

// Demo Functions
async function runDemo(type) {
    const demoResultDiv = document.getElementById('demoResult');
    demoResultDiv.classList.remove('hidden');
    demoResultDiv.innerHTML = `
        <div class="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md">
            <div class="flex items-center">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-800 mr-2"></div>
                Running ${type} demo...
            </div>
        </div>
    `;

    try {
        const response = await fetch(`/api/demo/${type}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });
        
        const result = await response.json();
        
        if (response.ok) {
            displayDemoResult(type, result);
        } else {
            demoResultDiv.innerHTML = `
                <div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
                    <strong class="font-medium">❌ Demo failed:</strong><br>
                    <span class="text-sm">${result.error || 'Unknown error'}</span>
                </div>
            `;
        }
    } catch (error) {
        demoResultDiv.innerHTML = `
            <div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
                <strong class="font-medium">❌ Error:</strong><br>
                <span class="text-sm">${error.message}</span>
            </div>
        `;
    }
}

function displayDemoResult(type, result) {
    const demoResultDiv = document.getElementById('demoResult');
    let content = '';

    switch (type) {
        case 'basic':
            content = `
                <div class="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
                    <strong class="font-medium">✅ Basic Email Demo Complete</strong><br>
                    <div class="text-sm mt-2">
                        ${result.success ? 
                            `Email sent via ${result.result.providerId} in ${result.result.attempts} attempt(s)` :
                            `Failed: ${result.error}`
                        }
                    </div>
                </div>
            `;
            break;
        
        case 'retry':
            content = `
                <div class="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
                    <strong class="font-medium">✅ Retry Logic Demo Complete</strong><br>
                    <div class="text-sm mt-2">
                        ${result.success ? 
                            `Email sent via fallback provider ${result.result.providerId} in ${result.result.attempts} attempt(s)` :
                            `Failed: ${result.error}`
                        }
                    </div>
                </div>
            `;
            break;
        
        case 'rate-limit':
            const successCount = result.filter(r => r.success).length;
            const failCount = result.filter(r => !r.success).length;
            content = `
                <div class="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
                    <strong class="font-medium">⏱️ Rate Limiting Demo Complete</strong><br>
                    <div class="text-sm mt-2">
                        ${successCount} emails sent successfully, ${failCount} rate limited
                    </div>
                </div>
            `;
            break;
        
        case 'queue':
            content = `
                <div class="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md">
                    <strong class="font-medium">📬 Queue Processing Demo Complete</strong><br>
                    <div class="text-sm mt-2">
                        Processed ${result.length} queued emails<br>
                        ${result.map(r => `${r.id}: ${r.status.status}`).join('<br>')}
                    </div>
                </div>
            `;
            break;
        
        case 'circuit-breaker':
            const sentCount = result.filter(r => r.success).length;
            content = `
                <div class="bg-purple-50 border border-purple-200 text-purple-800 px-4 py-3 rounded-md">
                    <strong class="font-medium">⚡ Circuit Breaker Demo Complete</strong><br>
                    <div class="text-sm mt-2">
                        ${sentCount} emails sent, ${result.length - sentCount} blocked by circuit breaker
                    </div>
                </div>
            `;
            break;
        
        case 'full':
            content = `
                <div class="bg-indigo-50 border border-indigo-200 text-indigo-800 px-4 py-3 rounded-md">
                    <strong class="font-medium">🚀 Full Demo Complete</strong><br>
                    <div class="text-sm mt-2">
                        ${result.summary ? 
                            `Total emails: ${result.summary.totalEmails}<br>Status: ${JSON.stringify(result.summary.statusCounts)}` :
                            'Demo completed - check console for details'
                        }
                    </div>
                </div>
            `;
            break;
        
        default:
            content = `
                <div class="bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded-md">
                    <strong class="font-medium">Demo Complete</strong><br>
                    <pre class="text-xs mt-2 overflow-auto">${JSON.stringify(result, null, 2)}</pre>
                </div>
            `;
    }

    demoResultDiv.innerHTML = content;
}

// Legacy demo functions for manual testing
async function sendTestEmail(forceFailure) {
    const emailData = {
        to: 'test@example.com',
        from: 'demo@example.com',
        subject: `Test Email - ${forceFailure}`,
        body: `This is a test email to demonstrate ${forceFailure} functionality.`
    };

    try {
        const response = await fetch('/api/email/send', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(emailData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(`✅ Test email sent successfully via ${result.provider} in ${result.attempts} attempt(s)`);
        } else {
            alert(`❌ Test email failed: ${result.error}`);
        }
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
    }
}

async function sendMultipleEmails() {
    const promises = [];
    for (let i = 0; i < 5; i++) {
        const emailData = {
            to: 'test@example.com',
            from: 'demo@example.com',
            subject: `Rate Limit Test ${i + 1}`,
            body: `This is test email ${i + 1} for rate limiting.`
        };
        
        promises.push(fetch('/api/email/send', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(emailData)
        }));
    }

    try {
        const responses = await Promise.all(promises);
        const results = await Promise.all(responses.map(r => r.json()));
        
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        alert(`Rate limiting test complete:\n✅ ${successful} emails sent\n❌ ${failed} emails failed/rate limited`);
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
    }
}

async function runFullDemo() {
    if (confirm('This will run a comprehensive demo of all features. Continue?')) {
        await runDemo('full');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const colors = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800'
    };
    
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${colors[type]} border px-4 py-3 rounded-md shadow-lg z-50 max-w-sm`;
    notification.innerHTML = `
        <div class="flex justify-between items-start">
            <span class="text-sm whitespace-pre-line">${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-2 font-bold">&times;</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Load status on page load
document.addEventListener('DOMContentLoaded', loadStatus);

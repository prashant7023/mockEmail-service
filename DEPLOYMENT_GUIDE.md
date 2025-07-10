# Resilient Email Service - Complete Deployment Guide

## 🚀 Quick Start with Docker

### Pull and Run from Docker Hub
```bash
# Pull the latest image
docker pull prashant7023/resilient-email-service:latest

# Run the container
docker run -p 3001:3001 prashant7023/resilient-email-service:latest
```

Access the application at: http://localhost:3001

### Using Docker Compose
```bash
# Clone the repository and navigate to the project
git clone <repository-url>
cd resilient-email-service

# Start the services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the services
docker-compose down
```

## 🔧 Configuration Options

### Environment Variables
The container supports the following environment variables:

- `NODE_ENV` - Application environment (default: production)
- `PORT` - Server port (default: 3001)
- `MAX_RETRIES` - Maximum retry attempts (default: 3)
- `BASE_DELAY_MS` - Base delay between retries (default: 1000ms)
- `RATE_LIMIT_PER_MINUTE` - Rate limit per minute (default: 50)
- `CIRCUIT_BREAKER_THRESHOLD` - Circuit breaker failure threshold (default: 3)
- `CIRCUIT_BREAKER_TIMEOUT` - Circuit breaker timeout (default: 30000ms)

### Custom Configuration
```bash
docker run -p 3001:3001 \
  -e NODE_ENV=production \
  -e PORT=3001 \
  -e MAX_RETRIES=5 \
  -e RATE_LIMIT_PER_MINUTE=100 \
  prashant7023/resilient-email-service:latest
```

## 📋 API Endpoints

### Main Endpoints
- `GET /` - Web interface with demo buttons
- `GET /api/status` - Health check endpoint
- `POST /api/email` - Send email endpoint

### Demo Endpoints
- `GET /api/demo/success` - Success demo
- `GET /api/demo/failure` - Failure demo
- `GET /api/demo/rate-limit` - Rate limiting demo
- `GET /api/demo/circuit-breaker` - Circuit breaker demo
- `GET /api/demo/full` - Full demo suite

## 🏗️ Building from Source

### Prerequisites
- Node.js 18 or higher
- Docker and Docker Compose

### Local Development
```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Run tests
npm test

# Check test coverage
npm run test:coverage
```

### Build Docker Image
```bash
# Build the image
docker build -t prashant7023/resilient-email-service:latest .

# Run the built image
docker run -p 3001:3001 prashant7023/resilient-email-service:latest
```

## 🔍 Features

### Resilience Patterns
- **Circuit Breaker**: Prevents cascading failures
- **Rate Limiting**: Controls request flow
- **Retry Logic**: Handles transient failures
- **Fallback**: Graceful degradation

### Monitoring
- Health check endpoint
- Detailed logging
- Error tracking
- Performance metrics

### Security
- Non-root user in container
- Input validation
- Rate limiting
- CORS configuration

## 📊 Demo Features

The application includes interactive demos to showcase resilience patterns:

1. **Success Demo**: Shows successful email sending
2. **Failure Demo**: Demonstrates error handling
3. **Rate Limit Demo**: Shows rate limiting in action
4. **Circuit Breaker Demo**: Demonstrates circuit breaker pattern
5. **Full Demo**: Runs all patterns in sequence

## 🐳 Docker Hub

The image is available on Docker Hub:
- Repository: `prashant7023/resilient-email-service`
- Tags: `latest`, `v1.0.0`
- Size: ~188MB (Alpine-based)

## 📝 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Use a different port
   docker run -p 3002:3001 prashant7023/resilient-email-service:latest
   ```

2. **Container Won't Start**
   ```bash
   # Check logs
   docker logs <container-id>
   ```

3. **Health Check Failing**
   ```bash
   # Check if the application is responding
   curl http://localhost:3001/api/status
   ```

### Support
For issues and questions, please check:
- Application logs: `docker logs <container-name>`
- Health status: `GET /api/status`
- Demo endpoints for testing connectivity

## 🎯 Production Deployment

### Recommended Configuration
```yaml
# docker-compose.production.yml
version: '3.8'
services:
  app:
    image: prashant7023/resilient-email-service:latest
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MAX_RETRIES=5
      - RATE_LIMIT_PER_MINUTE=100
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/status"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Scaling
```bash
# Scale to multiple instances
docker-compose up --scale app=3 -d
```

## 📄 License
This project is licensed under the MIT License.

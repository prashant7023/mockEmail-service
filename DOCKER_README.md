# 🐳 Docker Deployment Guide

## Resilient Email Service - Docker Image

**Docker Hub Repository**: [prashant7023/resilient-email-service](https://hub.docker.com/r/prashant7023/resilient-email-service)

## 🚀 Quick Start

### Pull and Run from Docker Hub
```bash
# Pull the latest image
docker pull prashant7023/resilient-email-service:latest

# Run the container
docker run -p 3001:3001 prashant7023/resilient-email-service:latest
```

### Access the Application
- **Web Interface**: http://localhost:3001
- **API Base URL**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/status

## 🛠️ Build from Source

### Prerequisites
- Docker installed
- Docker Hub account (for pushing)

### Build Locally
```bash
# Clone the repository
git clone <your-repo-url>
cd resilient-email-service

# Build the Docker image
docker build -t prashant7023/resilient-email-service:latest .

# Run locally
docker run -p 3001:3001 prashant7023/resilient-email-service:latest
```

### Build and Push to Docker Hub

#### Option 1: Use the automated script (Windows)
```batch
# Build and push with default version (latest)
docker-build-push.bat

# Build and push with specific version
docker-build-push.bat v1.0.0
```

#### Option 2: Use the automated script (Linux/Mac)
```bash
# Make script executable
chmod +x docker-build-push.sh

# Build and push with default version (latest)
./docker-build-push.sh

# Build and push with specific version
./docker-build-push.sh v1.0.0
```

#### Option 3: Manual commands
```bash
# Build
docker build -t prashant7023/resilient-email-service:latest .

# Login to Docker Hub
docker login

# Push
docker push prashant7023/resilient-email-service:latest
```

## 🐳 Docker Compose Deployment

### Basic Deployment
```bash
# Start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

### Production Deployment (with Nginx)
```bash
# Start with production profile
docker-compose --profile production up -d

# This includes nginx reverse proxy on port 80
```

## ⚙️ Configuration

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node.js environment |
| `PORT` | `3001` | Application port |
| `MAX_RETRIES` | `3` | Maximum retry attempts |
| `BASE_DELAY_MS` | `1000` | Base delay between retries |
| `RATE_LIMIT_PER_MINUTE` | `50` | Rate limit for emails |
| `CIRCUIT_BREAKER_THRESHOLD` | `3` | Circuit breaker failure threshold |
| `CIRCUIT_BREAKER_TIMEOUT` | `30000` | Circuit breaker timeout (ms) |

### Custom Configuration
```bash
docker run -p 3001:3001 \
  -e MAX_RETRIES=5 \
  -e RATE_LIMIT_PER_MINUTE=100 \
  -e CIRCUIT_BREAKER_THRESHOLD=5 \
  prashant7023/resilient-email-service:latest
```

## 🔍 Health Monitoring

### Health Check Endpoint
```bash
curl http://localhost:3001/api/status
```

### Docker Health Check
The container includes a built-in health check that runs every 30 seconds:
```bash
docker ps  # Shows health status
```

## 📊 API Endpoints

Once running, the following endpoints are available:

### Email Operations
- `POST /api/email/send` - Send an email
- `POST /api/email/queue` - Queue an email
- `GET /api/email/status?id=<id>` - Get email status

### Queue Operations
- `POST /api/queue/process` - Process email queue
- `GET /api/status` - Get service status

### Demonstrations
- `POST /api/demo/basic` - Basic email demo
- `POST /api/demo/retry` - Retry logic demo
- `POST /api/demo/rate-limit` - Rate limiting demo
- `POST /api/demo/circuit-breaker` - Circuit breaker demo
- `POST /api/demo/queue` - Queue handling demo
- `POST /api/demo/full` - Run all demos

### System Operations
- `GET /api/health` - Provider health status
- `POST /api/reset` - Reset rate limiter
- `POST /api/reset-circuit-breakers` - Reset circuit breakers

## 🏗️ Image Details

### Base Image
- **Base**: `node:18-alpine`
- **Size**: Optimized for production (~150MB)
- **Security**: Runs as non-root user

### Features
- ✅ Production-optimized
- ✅ Health checks included
- ✅ Non-root user execution
- ✅ Environment variable configuration
- ✅ Automatic restart policies
- ✅ Multi-architecture support

## 🔄 Updating

### Pull Latest Version
```bash
docker pull prashant7023/resilient-email-service:latest
docker-compose pull
docker-compose up -d
```

### Rollback
```bash
# Run specific version
docker run -p 3001:3001 prashant7023/resilient-email-service:v1.0.0
```

## 📝 Example Use Cases

### Development
```bash
docker run -p 3001:3001 \
  -e NODE_ENV=development \
  prashant7023/resilient-email-service:latest
```

### Production with Custom Settings
```bash
docker run -d \
  --name email-service \
  -p 3001:3001 \
  -e MAX_RETRIES=5 \
  -e RATE_LIMIT_PER_MINUTE=100 \
  --restart unless-stopped \
  prashant7023/resilient-email-service:latest
```

### Load Testing Environment
```bash
docker run -p 3001:3001 \
  -e RATE_LIMIT_PER_MINUTE=1000 \
  -e CIRCUIT_BREAKER_THRESHOLD=10 \
  prashant7023/resilient-email-service:latest
```

## 🆘 Troubleshooting

### Check Container Logs
```bash
docker logs <container-id>
```

### Access Container Shell
```bash
docker exec -it <container-id> sh
```

### Verify Health
```bash
docker inspect <container-id> | grep Health -A 10
```

## 🔗 Links

- **Docker Hub**: https://hub.docker.com/r/prashant7023/resilient-email-service
- **Source Code**: [Your repository URL]
- **Documentation**: [Your docs URL]

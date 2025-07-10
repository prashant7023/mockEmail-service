# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory in container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy application source code
COPY . .

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S emailservice -u 1001

# Change ownership of the app directory to the nodejs user
RUN chown -R emailservice:nodejs /app
USER emailservice

# Expose the port the app runs on
EXPOSE 3001

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
               const options = { host: 'localhost', port: 3001, path: '/api/status', timeout: 2000 }; \
               const req = http.request(options, (res) => { \
                 if (res.statusCode === 200) process.exit(0); \
                 else process.exit(1); \
               }); \
               req.on('error', () => process.exit(1)); \
               req.end();"

# Define environment variables with defaults
ENV NODE_ENV=production
ENV PORT=3001
ENV MAX_RETRIES=3
ENV BASE_DELAY_MS=1000
ENV RATE_LIMIT_PER_MINUTE=50
ENV CIRCUIT_BREAKER_THRESHOLD=3
ENV CIRCUIT_BREAKER_TIMEOUT=30000

# Start the application
CMD ["node", "server/web-server.js"]

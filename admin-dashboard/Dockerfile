# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Next.js
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S wasalni -u 1001

# Change ownership
RUN chown -R wasalni:nodejs /app

# Switch to non-root user
USER wasalni

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

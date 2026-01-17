# Multi-stage build for Connectors service
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat git openssl
WORKDIR /app

# Copy Prisma schema and scripts BEFORE npm install (needed for postinstall script)
COPY prisma ./prisma
COPY scripts ./scripts

# Install ALL dependencies (including dev dependencies for build)
# Use npm install (works with or without package-lock.json)
COPY package.json package-lock.json* ./
RUN npm install

# Rebuild the source code only when needed
FROM base AS builder
# Install OpenSSL 3.x for Prisma (required for Prisma query engine during build)
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application (TypeScript compilation)
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

# Install OpenSSL 3.x for Prisma (required for Prisma query engine)
# CRITICAL: Install bash for release script (Alpine uses ash by default)
RUN apk add --no-cache openssl bash

ENV NODE_ENV=production
ENV PORT=3003
# Disable cluster mode for containerized deployments
ENV CLUSTER_MODE=false

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy Prisma schema and scripts first (needed for postinstall)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
# CRITICAL: Make release script executable for Fly.io release command
RUN chmod +x ./scripts/release.sh 2>/dev/null || true

# Install only production dependencies for runtime
# Use npm install (works with or without package-lock.json)
# CRITICAL: Also install Prisma CLI for release command (migrations)
# embracingearth.space - Database migrations run in release command
COPY package.json package-lock.json* ./
RUN npm install --omit=dev && \
    npm install -g prisma@^5.7.1 && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
# CRITICAL: Copy instrument.js for Sentry (required by server.ts)
# embracingearth.space - Enterprise error tracking
COPY instrument.js ./instrument.js
# Prisma schema already copied above

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/server.js"] 
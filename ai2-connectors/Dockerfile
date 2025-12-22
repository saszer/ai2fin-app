# Multi-stage build for Connectors service
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat git openssl1.1-compat
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
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application (TypeScript compilation)
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

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

# Install only production dependencies for runtime
# Use npm install (works with or without package-lock.json)
COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
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
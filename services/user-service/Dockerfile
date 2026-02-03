# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package.json package-lock.json tsconfig.base.json tsconfig.json ./
COPY services/user-service/package.json ./services/user-service/
COPY shared/types/package.json ./shared/types/
COPY shared/utils/package.json ./shared/utils/

# Install dependencies
RUN npm ci --workspace=@octo-eshop/user-service --workspace=@octo-eshop/types --workspace=@octo-eshop/utils

# Copy source code
COPY shared/ ./shared/
COPY services/user-service/ ./services/user-service/

# Generate Prisma client
WORKDIR /app/services/user-service
RUN npx prisma generate

# Build shared packages and service
WORKDIR /app
RUN npm run build --workspace=@octo-eshop/types
RUN npm run build --workspace=@octo-eshop/utils
RUN npm run build --workspace=@octo-eshop/user-service

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built files
COPY --from=builder /app/services/user-service/dist ./dist
COPY --from=builder /app/services/user-service/package.json ./
COPY --from=builder /app/services/user-service/node_modules ./node_modules
COPY --from=builder /app/services/user-service/prisma ./prisma

# Set ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

EXPOSE 3000

ENV NODE_ENV=production

# Startup script to run migrations and start app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]

# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy workspace files
COPY package.json package-lock.json tsconfig.base.json tsconfig.json ./
COPY services/user-service/package.json ./services/user-service/
COPY shared/types/package.json ./shared/types/
COPY shared/utils/package.json ./shared/utils/

# Install all dependencies (including devDependencies for build)
RUN npm ci

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
FROM node:20-slim AS production

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl wget && rm -rf /var/lib/apt/lists/*

# Add non-root user for security
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs nodejs

# Copy built files
COPY --from=builder /app/services/user-service/dist ./dist
COPY --from=builder /app/services/user-service/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/user-service/prisma ./prisma
COPY --from=builder /app/shared ./shared

# Generate Prisma client for this platform
RUN npx prisma generate --schema=prisma/schema.prisma

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

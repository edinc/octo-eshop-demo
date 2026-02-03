# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json tsconfig.json ./
COPY services/cart-service/package.json ./services/cart-service/
COPY shared/types/package.json ./shared/types/
COPY shared/utils/package.json ./shared/utils/

# Install all dependencies (including devDependencies for build)
RUN npm ci

COPY shared/ ./shared/
COPY services/cart-service/ ./services/cart-service/

WORKDIR /app
RUN npm run build --workspace=@octo-eshop/types
RUN npm run build --workspace=@octo-eshop/utils
RUN npm run build --workspace=@octo-eshop/cart-service

# Stage 2: Production
FROM node:20-slim AS production

WORKDIR /app

RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs nodejs

COPY --from=builder /app/services/cart-service/dist ./dist
COPY --from=builder /app/services/cart-service/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared ./shared

RUN chown -R nodejs:nodejs /app

USER nodejs

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]

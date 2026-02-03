# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json tsconfig.json ./
COPY services/payment-service/package.json ./services/payment-service/
COPY shared/types/package.json ./shared/types/
COPY shared/utils/package.json ./shared/utils/

RUN npm ci --workspace=@octo-eshop/payment-service --workspace=@octo-eshop/types --workspace=@octo-eshop/utils

COPY shared/ ./shared/
COPY services/payment-service/ ./services/payment-service/

WORKDIR /app
RUN npm run build --workspace=@octo-eshop/types
RUN npm run build --workspace=@octo-eshop/utils
RUN npm run build --workspace=@octo-eshop/payment-service

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=builder /app/services/payment-service/dist ./dist
COPY --from=builder /app/services/payment-service/package.json ./
COPY --from=builder /app/services/payment-service/node_modules ./node_modules

RUN chown -R nodejs:nodejs /app

USER nodejs

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]

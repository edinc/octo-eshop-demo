# Phase 5: Containerization

## Overview
Create Docker configurations for all services, set up docker-compose for local development, and optimize Docker images for production deployment.

## Prerequisites
- All services from Phases 2-4 implemented
- Docker Desktop installed locally

---

## Tasks

### 5.1 Backend Service Dockerfiles

**Objective:** Create optimized multi-stage Dockerfiles for Node.js services.

#### File: `services/user-service/Dockerfile`
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package.json package-lock.json ./
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

CMD ["node", "dist/index.js"]
```

#### File: `services/product-service/Dockerfile`
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY services/product-service/package.json ./services/product-service/
COPY shared/types/package.json ./shared/types/
COPY shared/utils/package.json ./shared/utils/

RUN npm ci --workspace=@octo-eshop/product-service --workspace=@octo-eshop/types --workspace=@octo-eshop/utils

COPY shared/ ./shared/
COPY services/product-service/ ./services/product-service/

WORKDIR /app/services/product-service
RUN npx prisma generate

WORKDIR /app
RUN npm run build --workspace=@octo-eshop/types
RUN npm run build --workspace=@octo-eshop/utils
RUN npm run build --workspace=@octo-eshop/product-service

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=builder /app/services/product-service/dist ./dist
COPY --from=builder /app/services/product-service/package.json ./
COPY --from=builder /app/services/product-service/node_modules ./node_modules
COPY --from=builder /app/services/product-service/prisma ./prisma

RUN chown -R nodejs:nodejs /app

USER nodejs

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
```

#### File: `services/cart-service/Dockerfile`
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY services/cart-service/package.json ./services/cart-service/
COPY shared/types/package.json ./shared/types/
COPY shared/utils/package.json ./shared/utils/

RUN npm ci --workspace=@octo-eshop/cart-service --workspace=@octo-eshop/types --workspace=@octo-eshop/utils

COPY shared/ ./shared/
COPY services/cart-service/ ./services/cart-service/

WORKDIR /app
RUN npm run build --workspace=@octo-eshop/types
RUN npm run build --workspace=@octo-eshop/utils
RUN npm run build --workspace=@octo-eshop/cart-service

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=builder /app/services/cart-service/dist ./dist
COPY --from=builder /app/services/cart-service/package.json ./
COPY --from=builder /app/services/cart-service/node_modules ./node_modules

RUN chown -R nodejs:nodejs /app

USER nodejs

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
```

#### File: `services/order-service/Dockerfile`
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY services/order-service/package.json ./services/order-service/
COPY shared/types/package.json ./shared/types/
COPY shared/utils/package.json ./shared/utils/

RUN npm ci --workspace=@octo-eshop/order-service --workspace=@octo-eshop/types --workspace=@octo-eshop/utils

COPY shared/ ./shared/
COPY services/order-service/ ./services/order-service/

WORKDIR /app/services/order-service
RUN npx prisma generate

WORKDIR /app
RUN npm run build --workspace=@octo-eshop/types
RUN npm run build --workspace=@octo-eshop/utils
RUN npm run build --workspace=@octo-eshop/order-service

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=builder /app/services/order-service/dist ./dist
COPY --from=builder /app/services/order-service/package.json ./
COPY --from=builder /app/services/order-service/node_modules ./node_modules
COPY --from=builder /app/services/order-service/prisma ./prisma

RUN chown -R nodejs:nodejs /app

USER nodejs

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
```

#### File: `services/payment-service/Dockerfile`
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
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
```

---

### 5.2 Frontend Dockerfile

**Objective:** Create optimized Dockerfile for React frontend with nginx.

#### File: `services/frontend/Dockerfile`
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY services/frontend/package.json ./services/frontend/
COPY shared/types/package.json ./shared/types/

# Install dependencies
RUN npm ci --workspace=@octo-eshop/frontend --workspace=@octo-eshop/types

# Copy source code
COPY shared/types/ ./shared/types/
COPY services/frontend/ ./services/frontend/

# Build shared types
RUN npm run build --workspace=@octo-eshop/types

# Build frontend
WORKDIR /app/services/frontend
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Production with nginx
FROM nginx:1.25-alpine AS production

# Copy custom nginx config
COPY services/frontend/nginx.conf /etc/nginx/nginx.conf

# Copy built assets
COPY --from=builder /app/services/frontend/dist /usr/share/nginx/html

# Add non-root user
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S nginx-user -u 1001 -G nginx-user && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    chown -R nginx-user:nginx-user /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-user /var/run/nginx.pid && \
    chown -R nginx-user:nginx-user /usr/share/nginx/html

USER nginx-user

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### File: `services/frontend/nginx.conf`
```nginx
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript 
               application/rss+xml application/atom+xml image/svg+xml;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Static assets with long cache
        location /assets {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # API proxy (for development/local)
        location /api {
            proxy_pass http://api-gateway:8080;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # SPA routing - serve index.html for all routes
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Error pages
        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
            root /usr/share/nginx/html;
        }
    }
}
```

---

### 5.3 Docker Compose for Local Development

**Objective:** Create docker-compose configuration for running all services locally.

#### File: `docker-compose.yml`
```yaml
version: '3.8'

services:
  # ===================
  # Databases
  # ===================
  postgres-user:
    image: postgres:16-alpine
    container_name: octo-postgres-user
    environment:
      POSTGRES_DB: userdb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres-user-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - octo-network

  postgres-product:
    image: postgres:16-alpine
    container_name: octo-postgres-product
    environment:
      POSTGRES_DB: productdb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5433:5432"
    volumes:
      - postgres-product-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - octo-network

  postgres-order:
    image: postgres:16-alpine
    container_name: octo-postgres-order
    environment:
      POSTGRES_DB: orderdb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5434:5432"
    volumes:
      - postgres-order-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - octo-network

  redis:
    image: redis:7-alpine
    container_name: octo-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - octo-network

  # ===================
  # Backend Services
  # ===================
  user-service:
    build:
      context: .
      dockerfile: services/user-service/Dockerfile
    container_name: octo-user-service
    ports:
      - "3001:3000"
    environment:
      NODE_ENV: development
      PORT: 3000
      DATABASE_URL: postgresql://postgres:postgres@postgres-user:5432/userdb
      JWT_SECRET: dev-jwt-secret-change-in-production
      JWT_EXPIRES_IN: 15m
      REFRESH_TOKEN_EXPIRES_IN: 7d
    depends_on:
      postgres-user:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - octo-network

  product-service:
    build:
      context: .
      dockerfile: services/product-service/Dockerfile
    container_name: octo-product-service
    ports:
      - "3002:3000"
    environment:
      NODE_ENV: development
      PORT: 3000
      DATABASE_URL: postgresql://postgres:postgres@postgres-product:5432/productdb
    depends_on:
      postgres-product:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - octo-network

  cart-service:
    build:
      context: .
      dockerfile: services/cart-service/Dockerfile
    container_name: octo-cart-service
    ports:
      - "3003:3000"
    environment:
      NODE_ENV: development
      PORT: 3000
      REDIS_URL: redis://redis:6379
      PRODUCT_SERVICE_URL: http://product-service:3000
    depends_on:
      redis:
        condition: service_healthy
      product-service:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - octo-network

  order-service:
    build:
      context: .
      dockerfile: services/order-service/Dockerfile
    container_name: octo-order-service
    ports:
      - "3004:3000"
    environment:
      NODE_ENV: development
      PORT: 3000
      DATABASE_URL: postgresql://postgres:postgres@postgres-order:5432/orderdb
      CART_SERVICE_URL: http://cart-service:3000
      PAYMENT_SERVICE_URL: http://payment-service:3000
      PRODUCT_SERVICE_URL: http://product-service:3000
    depends_on:
      postgres-order:
        condition: service_healthy
      cart-service:
        condition: service_healthy
      payment-service:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - octo-network

  payment-service:
    build:
      context: .
      dockerfile: services/payment-service/Dockerfile
    container_name: octo-payment-service
    ports:
      - "3005:3000"
    environment:
      NODE_ENV: development
      PORT: 3000
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - octo-network

  # ===================
  # API Gateway
  # ===================
  api-gateway:
    image: kong:3.5-alpine
    container_name: octo-api-gateway
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /kong/declarative/kong.yml
      KONG_PROXY_ACCESS_LOG: /dev/stdout
      KONG_ADMIN_ACCESS_LOG: /dev/stdout
      KONG_PROXY_ERROR_LOG: /dev/stderr
      KONG_ADMIN_ERROR_LOG: /dev/stderr
      KONG_ADMIN_LISTEN: 0.0.0.0:8001
    ports:
      - "8080:8000"
      - "8081:8001"
    volumes:
      - ./kong:/kong/declarative
    depends_on:
      - user-service
      - product-service
      - cart-service
      - order-service
      - payment-service
    networks:
      - octo-network

  # ===================
  # Frontend
  # ===================
  frontend:
    build:
      context: .
      dockerfile: services/frontend/Dockerfile
      args:
        VITE_API_URL: http://localhost:8080/api
    container_name: octo-frontend
    ports:
      - "3000:80"
    depends_on:
      - api-gateway
    networks:
      - octo-network

volumes:
  postgres-user-data:
  postgres-product-data:
  postgres-order-data:
  redis-data:

networks:
  octo-network:
    driver: bridge
```

#### File: `docker-compose.override.yml` (for development with hot reload)
```yaml
version: '3.8'

services:
  user-service:
    build:
      target: builder
    volumes:
      - ./services/user-service/src:/app/services/user-service/src
      - ./shared:/app/shared
    command: npm run dev --workspace=@octo-eshop/user-service

  product-service:
    build:
      target: builder
    volumes:
      - ./services/product-service/src:/app/services/product-service/src
      - ./shared:/app/shared
    command: npm run dev --workspace=@octo-eshop/product-service

  cart-service:
    build:
      target: builder
    volumes:
      - ./services/cart-service/src:/app/services/cart-service/src
      - ./shared:/app/shared
    command: npm run dev --workspace=@octo-eshop/cart-service

  order-service:
    build:
      target: builder
    volumes:
      - ./services/order-service/src:/app/services/order-service/src
      - ./shared:/app/shared
    command: npm run dev --workspace=@octo-eshop/order-service

  payment-service:
    build:
      target: builder
    volumes:
      - ./services/payment-service/src:/app/services/payment-service/src
      - ./shared:/app/shared
    command: npm run dev --workspace=@octo-eshop/payment-service

  frontend:
    build:
      target: builder
    volumes:
      - ./services/frontend/src:/app/services/frontend/src
    command: npm run dev --workspace=@octo-eshop/frontend -- --host
    ports:
      - "3000:5173"
```

---

### 5.4 Kong API Gateway Configuration

#### File: `kong/kong.yml`
```yaml
_format_version: "3.0"
_transform: true

services:
  - name: user-service
    url: http://user-service:3000
    routes:
      - name: user-routes
        paths:
          - /api/users
        strip_path: false

  - name: product-service
    url: http://product-service:3000
    routes:
      - name: product-routes
        paths:
          - /api/products
        strip_path: false

  - name: cart-service
    url: http://cart-service:3000
    routes:
      - name: cart-routes
        paths:
          - /api/cart
        strip_path: false

  - name: order-service
    url: http://order-service:3000
    routes:
      - name: order-routes
        paths:
          - /api/orders
        strip_path: false

  - name: payment-service
    url: http://payment-service:3000
    routes:
      - name: payment-routes
        paths:
          - /api/payments
        strip_path: false

plugins:
  - name: cors
    config:
      origins:
        - http://localhost:3000
      methods:
        - GET
        - POST
        - PUT
        - DELETE
        - OPTIONS
      headers:
        - Accept
        - Authorization
        - Content-Type
      exposed_headers:
        - X-Auth-Token
      credentials: true
      max_age: 3600

  - name: rate-limiting
    config:
      minute: 100
      policy: local

  - name: request-size-limiting
    config:
      allowed_payload_size: 10
```

---

### 5.5 Docker Ignore Files

#### File: `.dockerignore`
```
# Dependencies
node_modules
**/node_modules

# Build outputs
dist
**/dist
build
**/build

# Test files
**/*.test.ts
**/*.spec.ts
**/tests
**/coverage

# Development files
.env
.env.local
.env.*.local
**/.env

# IDE
.vscode
.idea
*.swp
*.swo

# Git
.git
.gitignore

# Docker
Dockerfile*
docker-compose*
.docker

# Documentation
*.md
!README.md
docs

# Misc
.DS_Store
*.log
npm-debug.log*
```

---

### 5.6 Build and Push Scripts

#### File: `scripts/build-images.sh`
```bash
#!/bin/bash

set -e

# Configuration
REGISTRY="${REGISTRY:-octoeshopacr.azurecr.io}"
TAG="${TAG:-latest}"

echo "Building Docker images..."

# Build all services
services=("user-service" "product-service" "cart-service" "order-service" "payment-service" "frontend")

for service in "${services[@]}"; do
    echo "Building $service..."
    docker build \
        -t "$REGISTRY/$service:$TAG" \
        -f "services/$service/Dockerfile" \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        --cache-from "$REGISTRY/$service:latest" \
        .
done

echo "All images built successfully!"
```

#### File: `scripts/push-images.sh`
```bash
#!/bin/bash

set -e

# Configuration
REGISTRY="${REGISTRY:-octoeshopacr.azurecr.io}"
TAG="${TAG:-latest}"

echo "Logging into Azure Container Registry..."
az acr login --name octoeshopacr

echo "Pushing Docker images..."

services=("user-service" "product-service" "cart-service" "order-service" "payment-service" "frontend")

for service in "${services[@]}"; do
    echo "Pushing $service..."
    docker push "$REGISTRY/$service:$TAG"
done

echo "All images pushed successfully!"
```

---

## Testing Docker Setup

### Local Testing Commands

```bash
# Build all images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service health
docker-compose ps

# Run database migrations
docker-compose exec user-service npx prisma migrate deploy
docker-compose exec product-service npx prisma migrate deploy
docker-compose exec order-service npx prisma migrate deploy

# Seed product data
docker-compose exec product-service npx prisma db seed

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

### Health Check Verification

```bash
# Test health endpoints
curl http://localhost:3001/health  # user-service
curl http://localhost:3002/health  # product-service
curl http://localhost:3003/health  # cart-service
curl http://localhost:3004/health  # order-service
curl http://localhost:3005/health  # payment-service
curl http://localhost:3000/health  # frontend
curl http://localhost:8080/api/products  # via API gateway
```

---

## Deliverables Checklist

- [ ] Dockerfile for user-service (multi-stage, optimized)
- [ ] Dockerfile for product-service
- [ ] Dockerfile for cart-service
- [ ] Dockerfile for order-service
- [ ] Dockerfile for payment-service
- [ ] Dockerfile for frontend (with nginx)
- [ ] nginx.conf for frontend
- [ ] docker-compose.yml for production-like setup
- [ ] docker-compose.override.yml for development
- [ ] Kong API Gateway configuration
- [ ] .dockerignore file
- [ ] Build and push scripts
- [ ] All services pass health checks
- [ ] All services communicate correctly via docker network
- [ ] Database migrations run successfully in containers

---

## Dependencies

**Depends on:**
- Phases 2-4: All services implemented

**Required by:**
- Phase 6: Kubernetes configuration
- Phase 7: Azure infrastructure (needs images in ACR)
- Phase 8: CI/CD pipeline (builds images)

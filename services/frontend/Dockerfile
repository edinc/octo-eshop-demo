# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json tsconfig.base.json tsconfig.json ./
COPY services/frontend/package.json ./services/frontend/
COPY shared/types/package.json ./shared/types/

# Install all dependencies (including devDependencies for build)
RUN npm ci

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
    mkdir -p /tmp/nginx/client_body /tmp/nginx/proxy /tmp/nginx/fastcgi /tmp/nginx/uwsgi /tmp/nginx/scgi && \
    chown -R nginx-user:nginx-user /tmp/nginx && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /etc/nginx/conf.d && \
    chown -R nginx-user:nginx-user /usr/share/nginx/html

USER nginx-user

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]

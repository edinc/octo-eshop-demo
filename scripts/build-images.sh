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

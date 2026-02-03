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

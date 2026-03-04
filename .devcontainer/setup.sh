#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Setting up Octo E-Shop development environment..."

# Install dependencies
npm install

# Set up git hooks
npx husky install

# Generate per-service .env files with correct DATABASE_URL for each service
declare -A DB_MAP=(
  ["user-service"]="postgresql://postgres:postgres@postgres-user:5432/userdb"
  ["product-service"]="postgresql://postgres:postgres@postgres-product:5432/productdb"
  ["order-service"]="postgresql://postgres:postgres@postgres-order:5432/orderdb"
)

for service in "${!DB_MAP[@]}"; do
  env_file="services/${service}/.env"
  if [ ! -f "$env_file" ]; then
    cat > "$env_file" <<EOF
DATABASE_URL=${DB_MAP[$service]}
EOF
    echo "  ✅ Created ${env_file}"
  else
    echo "  ⏭️  ${env_file} already exists, skipping"
  fi
done

# Cart service .env (Redis, no Postgres)
if [ ! -f "services/cart-service/.env" ]; then
  cat > "services/cart-service/.env" <<EOF
REDIS_URL=redis://redis:6379
PRODUCT_SERVICE_URL=http://localhost:3002
EOF
  echo "  ✅ Created services/cart-service/.env"
fi

# Run Prisma generate for each service with a schema
for service in user-service product-service order-service; do
  if [ -f "services/${service}/prisma/schema.prisma" ]; then
    echo "  🔄 Running prisma generate for ${service}..."
    npx --workspace="services/${service}" prisma generate || true
  fi
done

echo ""
echo "✅ Setup complete! Start services individually:"
echo "   npm run dev --workspace=services/user-service"
echo "   npm run dev --workspace=services/product-service"
echo "   npm run dev --workspace=services/frontend"

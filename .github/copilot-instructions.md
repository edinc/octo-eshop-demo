# Copilot Instructions for Octo E-Shop

## Project Overview

Bicycle e-commerce platform using microservices architecture deployed on Azure AKS.

**Status:** Planning phase - implementation plans in `plan/` folder.

## Technology Stack

- **Backend:** Node.js/TypeScript with Express
- **Frontend:** React with Vite and Tailwind CSS
- **Databases:** PostgreSQL (per-service) + Redis (cart)
- **ORM:** Prisma
- **Infrastructure:** Terraform on Azure (AKS, ACR, Key Vault)
- **Kubernetes:** Helm charts (one per microservice)
- **CI/CD:** GitHub Actions

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Azure Kubernetes Service                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐│
│  │Frontend │ │  User   │ │ Product │ │  Cart   │ │ Order  ││
│  │ (React) │ │ Service │ │ Service │ │ Service │ │Service ││
│  └─────────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬───┘│
│                   │           │           │           │     │
│              PostgreSQL  PostgreSQL    Redis    PostgreSQL  │
└─────────────────────────────────────────────────────────────┘
```

**6 Microservices:**
- `frontend` - React SPA served via nginx
- `user-service` - Authentication, JWT, profiles
- `product-service` - Bicycle catalog, search, filtering
- `cart-service` - Shopping cart (Redis-backed)
- `order-service` - Order lifecycle, saga pattern
- `payment-service` - Mock payment gateway

Each backend service follows the same structure:
```
services/{service-name}/
├── src/
│   ├── controllers/    # HTTP handlers
│   ├── services/       # Business logic
│   ├── repositories/   # Data access
│   ├── middleware/     # Auth, validation, logging
│   ├── routes/         # Express routes
│   └── utils/          # Helpers
├── tests/
├── prisma/             # Schema and migrations (PostgreSQL services)
├── Dockerfile
└── package.json
```

## Build & Run Commands

```bash
# Install all dependencies (monorepo with npm workspaces)
npm install

# Build all services
npm run build

# Run all tests
npm test

# Run tests for a single service
npm test --workspace=services/user-service

# Run a single test file
npm test --workspace=services/user-service -- src/services/userService.test.ts

# Lint all code
npm run lint

# Start local development (all services)
docker-compose up -d

# Run database migrations
docker-compose exec user-service npx prisma migrate deploy

# Seed product data
docker-compose exec product-service npx prisma db seed
```

## Terraform Commands

```bash
cd infrastructure/terraform/environments/dev
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

## Helm Deployment

```bash
# Deploy single service
helm upgrade --install user-service ./helm/charts/user-service \
  --namespace octo-eshop-dev \
  -f ./helm/charts/user-service/values-dev.yaml

# Deploy all services with Helmfile
cd helm && helmfile -e dev sync
```

## Key Conventions

### API Response Format
All endpoints return consistent JSON:
```typescript
{
  success: boolean;
  data?: T;
  error?: { code: string; message: string; };
  meta?: { page: number; limit: number; total: number; };
}
```

### Service Communication
- Synchronous: HTTP via internal Kubernetes DNS (`http://user-service`)
- Asynchronous: Azure Service Bus for events (order.created, order.paid, etc.)

### Authentication
- JWT access tokens (15min) + refresh tokens (7 days)
- Middleware validates tokens and attaches `req.user`
- Inter-service calls use `X-Service-Auth` header

### Database Per Service
Each service owns its database - no shared schemas. Use API calls for cross-service data.

### Environment Configuration
- ConfigMaps for non-sensitive config
- External Secrets Operator syncs Azure Key Vault → K8s Secrets

## Implementation Plans

Detailed implementation docs in `plan/`:
- `plan.md` - Main overview and architecture
- `phase-01-project-setup.md` through `phase-10-documentation-polish.md` - Step-by-step guides with code examples

# Bicycle E-Shop Implementation Plan

## Overview

A microservices-based bicycle e-commerce platform deployed on Azure AKS, using Terraform for infrastructure as code.

### Technology Stack
- **Backend:** Node.js/TypeScript
- **Frontend:** React
- **Database:** PostgreSQL (per-service databases)
- **Container Orchestration:** Azure Kubernetes Service (AKS)
- **Infrastructure as Code:** Terraform
- **CI/CD:** GitHub Actions
- **Repository Structure:** Monorepo

### Scope
MVP implementation with core e-commerce functionality:
- User authentication and profiles
- Product catalog (bicycles)
- Shopping cart
- Order management
- Mock payment service

---

## Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Azure Cloud                                     │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        Azure Front Door / CDN                          │  │
│  └─────────────────────────────────┬─────────────────────────────────────┘  │
│                                    │                                         │
│  ┌─────────────────────────────────▼─────────────────────────────────────┐  │
│  │                     Azure Application Gateway                          │  │
│  │                        (Ingress Controller)                            │  │
│  └─────────────────────────────────┬─────────────────────────────────────┘  │
│                                    │                                         │
│  ┌─────────────────────────────────▼─────────────────────────────────────┐  │
│  │                    Azure Kubernetes Service (AKS)                      │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                         Microservices                            │  │  │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │  │  │
│  │  │  │ Frontend│ │  User   │ │ Product │ │  Cart   │ │  Order  │   │  │  │
│  │  │  │ (React) │ │ Service │ │ Service │ │ Service │ │ Service │   │  │  │
│  │  │  └─────────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │  │  │
│  │  │                   │           │           │           │         │  │  │
│  │  │  ┌─────────┐      │           │           │           │         │  │  │
│  │  │  │ Payment │      │           │           │           │         │  │  │
│  │  │  │ Service │      │           │           │           │         │  │  │
│  │  │  └────┬────┘      │           │           │           │         │  │  │
│  │  │       │           │           │           │           │         │  │  │
│  │  │  ┌────▼───────────▼───────────▼───────────▼───────────▼─────┐   │  │  │
│  │  │  │                    API Gateway / Service Mesh             │   │  │  │
│  │  │  │                         (Kong / Istio)                    │   │  │  │
│  │  │  └──────────────────────────────────────────────────────────┘   │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│  ┌─────────────────────────────────▼─────────────────────────────────────┐  │
│  │                         Data Layer                                     │  │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐              │  │
│  │  │ User DB   │ │Product DB │ │ Cart DB   │ │ Order DB  │              │  │
│  │  │(PostgreSQL)│ │(PostgreSQL)│ │  (Redis)  │ │(PostgreSQL)│             │  │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘              │  │
│  │                                                                        │  │
│  │  ┌───────────────────────────────────────────────────────────────┐    │  │
│  │  │              Azure Service Bus (Message Queue)                 │    │  │
│  │  └───────────────────────────────────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    Observability & Security                            │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │  │
│  │  │  Azure      │ │   Azure     │ │   Azure     │ │   Azure     │      │  │
│  │  │  Monitor    │ │   Key Vault │ │   Log       │ │   Container │      │  │
│  │  │             │ │             │ │   Analytics │ │   Registry  │      │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Microservices Breakdown

### 1. Frontend Service (React SPA)
**Purpose:** User-facing web application

**Pages:**
- Homepage with e-shop description and featured bikes
- Products page with bike catalog, filtering, and search
- Product detail page
- Shopping cart
- Checkout flow
- User profile and order history
- Login/Register

**Key Features:**
- Responsive design
- SEO-friendly meta tags
- Image lazy loading
- Client-side caching

### 2. User Service
**Purpose:** Authentication, authorization, and user management

**Endpoints:**
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login (JWT)
- `POST /api/users/logout` - User logout
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/refresh-token` - Refresh JWT token

**Database:** PostgreSQL (users, addresses, sessions)

### 3. Product Service
**Purpose:** Bicycle catalog management

**Endpoints:**
- `GET /api/products` - List products (with pagination, filters)
- `GET /api/products/:id` - Get product details
- `GET /api/products/categories` - List categories
- `GET /api/products/search` - Search products
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

**Database:** PostgreSQL (products, categories, images)

**Product Data Model:**
```typescript
interface Bicycle {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'mountain' | 'road' | 'hybrid' | 'electric' | 'kids';
  brand: string;
  images: string[];
  specifications: {
    frameSize: string;
    wheelSize: string;
    weight: number;
    material: string;
    gears: number;
  };
  stock: number;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 4. Cart Service
**Purpose:** Shopping cart management

**Endpoints:**
- `GET /api/cart` - Get user's cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:id` - Update item quantity
- `DELETE /api/cart/items/:id` - Remove item from cart
- `DELETE /api/cart` - Clear cart

**Database:** Redis (for performance, session-based carts)

### 5. Order Service
**Purpose:** Order processing and management

**Endpoints:**
- `POST /api/orders` - Create order from cart
- `GET /api/orders` - List user's orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status (admin)
- `POST /api/orders/:id/cancel` - Cancel order

**Database:** PostgreSQL (orders, order_items, order_status_history)

**Order States:** `pending` → `paid` → `processing` → `shipped` → `delivered` / `cancelled`

### 6. Payment Service (Mock)
**Purpose:** Handle payment processing (mock implementation)

**Endpoints:**
- `POST /api/payments` - Process payment
- `GET /api/payments/:id` - Get payment status
- `POST /api/payments/:id/refund` - Process refund

**Note:** Mock implementation simulates payment gateway responses for development.

---

## Azure Services

| Service | Purpose |
|---------|---------|
| **AKS** | Container orchestration for microservices |
| **Azure Container Registry** | Docker image storage |
| **Azure Database for PostgreSQL** | Managed PostgreSQL databases |
| **Azure Cache for Redis** | Cart service caching |
| **Azure Service Bus** | Async messaging between services |
| **Azure Key Vault** | Secrets management |
| **Azure Monitor** | Logging and monitoring |
| **Azure Application Gateway** | Ingress and load balancing |
| **Azure Front Door** | CDN and global load balancing |
| **Azure Blob Storage** | Product images storage |

---

## Repository Structure

```
octo-eshop-demo/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # CI pipeline
│       ├── cd-staging.yml            # Deploy to staging
│       └── cd-production.yml         # Deploy to production
├── plan/
│   └── plan.md                       # This plan
├── infrastructure/
│   └── terraform/
│       ├── environments/
│       │   ├── dev/
│       │   │   ├── main.tf
│       │   │   ├── variables.tf
│       │   │   └── terraform.tfvars
│       │   ├── staging/
│       │   └── production/
│       └── modules/
│           ├── aks/
│           ├── acr/
│           ├── postgresql/
│           ├── redis/
│           ├── keyvault/
│           ├── servicebus/
│           ├── storage/
│           └── networking/
├── services/
│   ├── frontend/
│   │   ├── src/
│   │   ├── public/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── nginx.conf
│   ├── user-service/
│   │   ├── src/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── product-service/
│   │   ├── src/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── cart-service/
│   │   ├── src/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── order-service/
│   │   ├── src/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── package.json
│   └── payment-service/
│       ├── src/
│       ├── tests/
│       ├── Dockerfile
│       └── package.json
├── kubernetes/
│   ├── base/
│   │   ├── namespace.yaml
│   │   ├── configmaps/
│   │   ├── secrets/
│   │   └── services/
│   │       ├── frontend/
│   │       ├── user-service/
│   │       ├── product-service/
│   │       ├── cart-service/
│   │       ├── order-service/
│   │       └── payment-service/
│   └── overlays/
│       ├── dev/
│       ├── staging/
│       └── production/
├── shared/
│   ├── types/                        # Shared TypeScript types
│   └── utils/                        # Shared utilities
├── scripts/
│   ├── setup-local.sh               # Local dev setup
│   ├── seed-data.sh                 # Database seeding
│   └── deploy.sh                    # Deployment helper
├── docker-compose.yml               # Local development
├── docker-compose.override.yml      # Local overrides
├── package.json                     # Root package.json (workspaces)
├── tsconfig.base.json               # Base TypeScript config
└── README.md
```

---

## Implementation Phases

> **Detailed phase documentation is available in separate files:**
> - [Phase 1: Project Setup & Infrastructure Foundation](./phase-01-project-setup.md)
> - [Phase 2: Core Backend Services](./phase-02-core-backend-services.md)
> - [Phase 3: Order & Payment Services](./phase-03-order-payment-services.md)
> - [Phase 4: Frontend Development](./phase-04-frontend-development.md)
> - [Phase 5: Containerization](./phase-05-containerization.md)
> - [Phase 6: Kubernetes Configuration](./phase-06-kubernetes-configuration.md)
> - [Phase 7: Azure Infrastructure with Terraform](./phase-07-azure-infrastructure.md)
> - [Phase 8: CI/CD Pipeline](./phase-08-cicd-pipeline.md)
> - [Phase 9: Observability & Security](./phase-09-observability-security.md)
> - [Phase 10: Documentation & Polish](./phase-10-documentation-polish.md)

### Phase 1: Project Setup & Infrastructure Foundation
- [ ] Initialize monorepo with npm workspaces
- [ ] Set up TypeScript configuration
- [ ] Set up ESLint and Prettier
- [ ] Create base Terraform modules
- [ ] Set up Azure resource group and networking
- [ ] Create Azure Container Registry
- [ ] Set up GitHub Actions for CI

### Phase 2: Core Backend Services
- [ ] Implement User Service
  - [ ] Database schema and migrations
  - [ ] Registration endpoint
  - [ ] Login/logout with JWT
  - [ ] Profile management
  - [ ] Unit tests
- [ ] Implement Product Service
  - [ ] Database schema and migrations
  - [ ] CRUD endpoints
  - [ ] Search and filtering
  - [ ] Seed data for bicycles
  - [ ] Unit tests
- [ ] Implement Cart Service
  - [ ] Redis integration
  - [ ] Cart CRUD operations
  - [ ] Unit tests

### Phase 3: Order & Payment Services
- [ ] Implement Order Service
  - [ ] Database schema and migrations
  - [ ] Order creation from cart
  - [ ] Order status management
  - [ ] Order history
  - [ ] Unit tests
- [ ] Implement Payment Service (Mock)
  - [ ] Mock payment processing
  - [ ] Payment status tracking
  - [ ] Unit tests

### Phase 4: Frontend Development
- [ ] Set up React project with Vite
- [ ] Implement component library
- [ ] Create Homepage
  - [ ] Hero section
  - [ ] Featured products
  - [ ] E-shop description
- [ ] Create Products page
  - [ ] Product grid
  - [ ] Filters (category, price, brand)
  - [ ] Search functionality
  - [ ] Pagination
- [ ] Create Product detail page
- [ ] Create Cart page
- [ ] Create Checkout flow
- [ ] Create User profile pages
- [ ] Implement authentication flow

### Phase 5: Containerization
- [ ] Create Dockerfiles for all services
- [ ] Create docker-compose for local development
- [ ] Test all services with Docker locally
- [ ] Optimize Docker images (multi-stage builds)

### Phase 6: Kubernetes Configuration
- [ ] Create Kubernetes manifests for all services
- [ ] Set up Kustomize for environment overlays
- [ ] Configure ingress and load balancing
- [ ] Set up ConfigMaps and Secrets
- [ ] Configure health checks and readiness probes
- [ ] Set up horizontal pod autoscaling

### Phase 7: Azure Infrastructure with Terraform
- [ ] Deploy AKS cluster
- [ ] Deploy Azure Database for PostgreSQL
- [ ] Deploy Azure Cache for Redis
- [ ] Deploy Azure Service Bus
- [ ] Deploy Azure Key Vault
- [ ] Deploy Azure Blob Storage
- [ ] Configure networking and security groups
- [ ] Set up Azure Monitor and Log Analytics

### Phase 8: CI/CD Pipeline
- [ ] Create GitHub Actions CI workflow
  - [ ] Run tests
  - [ ] Build Docker images
  - [ ] Push to ACR
- [ ] Create CD workflow for staging
- [ ] Create CD workflow for production
- [ ] Set up branch protection rules

### Phase 9: Observability & Security
- [ ] Configure centralized logging
- [ ] Set up monitoring dashboards
- [ ] Configure alerts
- [ ] Implement API rate limiting
- [ ] Security scanning in CI pipeline
- [ ] Configure HTTPS/TLS

### Phase 10: Documentation & Polish
- [ ] Write API documentation (OpenAPI/Swagger)
- [ ] Create README with setup instructions
- [ ] Document deployment procedures
- [ ] Create architecture decision records (ADRs)
- [ ] Performance testing and optimization

---

## Sample Bicycle Data

For the product catalog, we'll seed with bicycle data across categories:

| Category | Examples |
|----------|----------|
| Mountain | Trail bikes, Downhill, Cross-country |
| Road | Racing bikes, Endurance, Aero |
| Hybrid | Commuter, Fitness, Touring |
| Electric | E-MTB, E-Road, E-Commuter |
| Kids | Balance bikes, Youth MTB |

Brands to include: Trek, Specialized, Giant, Cannondale, Scott, Canyon, etc.

---

## Local Development

```bash
# Start all services locally
docker-compose up -d

# Run individual service
cd services/product-service
npm run dev

# Run tests
npm run test

# Run linting
npm run lint
```

---

## Deployment Commands

```bash
# Initialize Terraform
cd infrastructure/terraform/environments/dev
terraform init

# Plan infrastructure changes
terraform plan

# Apply infrastructure
terraform apply

# Deploy to AKS
kubectl apply -k kubernetes/overlays/dev
```

---

## Success Criteria

- [ ] All microservices running on AKS
- [ ] Frontend accessible via public URL
- [ ] User registration and authentication working
- [ ] Product catalog displays bicycles with images
- [ ] Shopping cart persists across sessions
- [ ] Order placement completes successfully
- [ ] CI/CD pipelines deploy automatically
- [ ] Monitoring and logging operational
- [ ] All services have 80%+ test coverage

---

## Future Enhancements (Post-MVP)

1. **Inventory Service** - Real-time stock management
2. **Notification Service** - Email/SMS for order updates
3. **Review Service** - Customer reviews and ratings
4. **Recommendation Engine** - ML-based product suggestions
5. **Analytics Dashboard** - Business intelligence
6. **Admin Panel** - Product and order management UI
7. **Real Payment Gateway** - Stripe/PayPal integration
8. **Multi-language Support** - i18n
9. **Mobile App** - React Native application

---

## Notes & Considerations

- **Security:** All inter-service communication should use internal service mesh (Istio) with mTLS
- **Scalability:** Cart and Product services are likely to have highest load; plan HPA accordingly
- **Data Consistency:** Use Saga pattern for distributed transactions (order → payment → inventory)
- **Cost Optimization:** Start with small AKS node pool, scale based on actual usage
- **Disaster Recovery:** Configure PostgreSQL backups, AKS pod disruption budgets

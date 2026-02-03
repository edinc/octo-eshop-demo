# Octo E-Shop

Bicycle e-commerce platform using microservices architecture.

## Prerequisites

- Node.js 20+
- Docker Desktop
- Git

## Quick Start

```bash
# Install dependencies
npm install

# Start local development
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Build all services
npm run build
```

## Project Structure

```
octo-eshop-demo/
├── services/           # Microservices
│   ├── frontend/       # React SPA
│   ├── user-service/   # Authentication & profiles
│   ├── product-service/# Bicycle catalog
│   ├── cart-service/   # Shopping cart (Redis)
│   ├── order-service/  # Order lifecycle
│   └── payment-service/# Mock payment gateway
├── shared/             # Shared code
│   ├── types/          # TypeScript types
│   └── utils/          # Utility functions
├── infrastructure/     # Terraform configs
├── kubernetes/         # K8s manifests
├── scripts/            # Utility scripts
└── plan/               # Implementation plans
```

## Technology Stack

- **Backend:** Node.js/TypeScript with Express
- **Frontend:** React with Vite and Tailwind CSS
- **Databases:** PostgreSQL + Redis
- **ORM:** Prisma
- **Infrastructure:** Azure AKS (Terraform)
- **CI/CD:** GitHub Actions

## Development

Each service follows the same structure:

```
services/{service-name}/
├── src/
│   ├── controllers/    # HTTP handlers
│   ├── services/       # Business logic
│   ├── repositories/   # Data access
│   ├── middleware/     # Auth, validation
│   ├── routes/         # Express routes
│   └── utils/          # Helpers
├── tests/
├── prisma/             # Schema & migrations
├── Dockerfile
└── package.json
```

## License

Private

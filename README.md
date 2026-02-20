# Octo E-Shop 🚲

[![CI Pipeline](https://github.com/edinc/octo-eshop-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/edinc/octo-eshop-demo/actions/workflows/ci.yml)
[![Build and Push Images](https://github.com/edinc/octo-eshop-demo/actions/workflows/build-push.yml/badge.svg)](https://github.com/edinc/octo-eshop-demo/actions/workflows/build-push.yml)
[![Deploy to Environment](https://github.com/edinc/octo-eshop-demo/actions/workflows/deploy.yml/badge.svg)](https://github.com/edinc/octo-eshop-demo/actions/workflows/deploy.yml)

A bicycle e-commerce platform built with microservices architecture, deployed on Azure Kubernetes Service.

![Architecture](docs/architecture.png)

## Technology Stack

| Layer              | Technology                               |
| ------------------ | ---------------------------------------- |
| **Frontend**       | React, Vite, Tailwind CSS, Redux Toolkit |
| **Backend**        | Node.js, TypeScript, Express             |
| **Databases**      | PostgreSQL (Prisma ORM), Redis           |
| **Infrastructure** | Azure AKS, Terraform                     |
| **CI/CD**          | GitHub Actions, Helm                     |

## Services

| Service             | Description                                  |
| ------------------- | -------------------------------------------- |
| **frontend**        | React SPA — product browsing, cart, checkout |
| **user-service**    | Authentication, profiles, JWT tokens         |
| **product-service** | Bicycle catalog, inventory management        |
| **cart-service**    | Shopping cart (Redis-backed)                 |
| **order-service**   | Order orchestration across services          |
| **payment-service** | Payment processing (mock gateway)            |

## Quick Start

### From scratch (new Azure environment)

```bash
# One-time bootstrap: creates Terraform state backend + Azure SP + GitHub secrets
./scripts/bootstrap-backend.sh

# Then trigger infrastructure provisioning (includes cluster add-ons setup)
gh workflow run infrastructure.yml -f environment=dev -f action=apply
```

### Existing environment

```bash
# Install dependencies
npm install

# Start local development
docker-compose up -d

# Run tests
npm test

# Build all services
npm run build
```

## Project Structure

```
octo-eshop-demo/
├── services/               # Microservices (npm workspaces)
│   ├── frontend/           # React SPA
│   ├── user-service/       # Authentication & profiles
│   ├── product-service/    # Bicycle catalog
│   ├── cart-service/       # Shopping cart (Redis)
│   ├── order-service/      # Order lifecycle
│   └── payment-service/    # Mock payment gateway
├── shared/                 # Shared packages
│   ├── types/              # @octo-eshop/types
│   └── utils/              # @octo-eshop/utils
├── infrastructure/         # Terraform (Azure)
├── kubernetes/             # K8s manifests & cluster setup
├── helm/                   # Helm charts (one per service)
├── docs/                   # Architecture & pipeline docs
└── scripts/                # Bootstrap & utility scripts
```

## Documentation

| Document                                         | Description                                             |
| ------------------------------------------------ | ------------------------------------------------------- |
| [Azure Architecture](docs/azure-architecture.md) | Infrastructure design, Azure services, network topology |
| [CI/CD Pipeline](docs/cicd-pipeline.md)          | Workflows, deployment strategy, operational runbook     |

## License

Private

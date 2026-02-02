# Phase 1: Project Setup & Infrastructure Foundation

## Overview
Set up the monorepo structure, development tooling, and foundational Azure infrastructure to support the microservices development.

## Prerequisites
- Node.js 20+ installed
- Azure CLI installed and authenticated
- Terraform 1.5+ installed
- Docker Desktop installed
- GitHub account with repository access

---

## Tasks

### 1.1 Initialize Monorepo with npm Workspaces

**Objective:** Create a monorepo structure using npm workspaces for shared dependencies and scripts.

#### Steps:
- [ ] Create root `package.json` with workspaces configuration
- [ ] Define workspace paths for services, shared libraries
- [ ] Configure root-level scripts for common operations

#### File: `package.json`
```json
{
  "name": "octo-eshop",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "services/*",
    "shared/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces --if-present",
    "test": "npm run test --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present",
    "dev": "docker-compose up -d",
    "clean": "rm -rf node_modules && npm run clean --workspaces --if-present"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "eslint": "^8.56.0",
    "prettier": "^3.2.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.2.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}
```

#### Directory Structure to Create:
```
octo-eshop-demo/
├── services/
│   ├── frontend/
│   ├── user-service/
│   ├── product-service/
│   ├── cart-service/
│   ├── order-service/
│   └── payment-service/
├── shared/
│   ├── types/
│   └── utils/
├── infrastructure/
│   └── terraform/
├── kubernetes/
├── scripts/
└── .github/
    └── workflows/
```

---

### 1.2 Set Up TypeScript Configuration

**Objective:** Create a base TypeScript configuration that all services extend.

#### File: `tsconfig.base.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  },
  "exclude": ["node_modules", "dist", "coverage"]
}
```

#### Service-specific `tsconfig.json` (template):
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

---

### 1.3 Set Up ESLint and Prettier

**Objective:** Configure consistent code formatting and linting across all services.

#### File: `.eslintrc.json`
```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": ["./tsconfig.base.json", "./services/*/tsconfig.json"]
  },
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  },
  "ignorePatterns": ["dist", "node_modules", "coverage", "*.js"]
}
```

#### File: `.prettierrc`
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

#### File: `.prettierignore`
```
dist
node_modules
coverage
*.md
*.json
```

#### Git Hooks with Husky:

File: `.husky/pre-commit`
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

File: `.lintstagedrc`
```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,yml,yaml}": ["prettier --write"]
}
```

---

### 1.4 Create Base Terraform Modules

**Objective:** Set up Terraform project structure with reusable modules.

#### Directory Structure:
```
infrastructure/terraform/
├── modules/
│   ├── networking/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── aks/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── acr/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── postgresql/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── redis/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── keyvault/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── servicebus/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── storage/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── environments/
    ├── dev/
    │   ├── main.tf
    │   ├── variables.tf
    │   ├── outputs.tf
    │   ├── terraform.tfvars
    │   └── backend.tf
    ├── staging/
    └── production/
```

#### File: `infrastructure/terraform/modules/networking/main.tf`
```hcl
resource "azurerm_virtual_network" "main" {
  name                = "${var.project_name}-${var.environment}-vnet"
  location            = var.location
  resource_group_name = var.resource_group_name
  address_space       = var.vnet_address_space

  tags = var.tags
}

resource "azurerm_subnet" "aks" {
  name                 = "aks-subnet"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = var.aks_subnet_prefix
}

resource "azurerm_subnet" "database" {
  name                 = "database-subnet"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = var.database_subnet_prefix

  delegation {
    name = "postgresql-delegation"
    service_delegation {
      name = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/join/action"
      ]
    }
  }
}

resource "azurerm_network_security_group" "aks" {
  name                = "${var.project_name}-${var.environment}-aks-nsg"
  location            = var.location
  resource_group_name = var.resource_group_name

  tags = var.tags
}
```

#### File: `infrastructure/terraform/modules/acr/main.tf`
```hcl
resource "azurerm_container_registry" "main" {
  name                = "${var.project_name}${var.environment}acr"
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = var.sku
  admin_enabled       = var.admin_enabled

  tags = var.tags
}
```

---

### 1.5 Set Up Azure Resource Group and Networking

**Objective:** Create foundational Azure resources for the dev environment.

#### File: `infrastructure/terraform/environments/dev/main.tf`
```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.85.0"
    }
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy = true
    }
  }
}

resource "azurerm_resource_group" "main" {
  name     = "${var.project_name}-${var.environment}-rg"
  location = var.location

  tags = local.common_tags
}

module "networking" {
  source = "../../modules/networking"

  project_name        = var.project_name
  environment         = var.environment
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  vnet_address_space  = ["10.0.0.0/16"]
  aks_subnet_prefix   = ["10.0.1.0/24"]
  database_subnet_prefix = ["10.0.2.0/24"]
  tags                = local.common_tags
}

locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
```

#### File: `infrastructure/terraform/environments/dev/variables.tf`
```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "octoeshop"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus"
}
```

#### File: `infrastructure/terraform/environments/dev/backend.tf`
```hcl
terraform {
  backend "azurerm" {
    resource_group_name  = "octoeshop-tfstate-rg"
    storage_account_name = "octoeshoptfstate"
    container_name       = "tfstate"
    key                  = "dev.terraform.tfstate"
  }
}
```

---

### 1.6 Create Azure Container Registry

**Objective:** Set up ACR for storing Docker images.

#### Add to `infrastructure/terraform/environments/dev/main.tf`:
```hcl
module "acr" {
  source = "../../modules/acr"

  project_name        = var.project_name
  environment         = var.environment
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "Basic"
  admin_enabled       = true
  tags                = local.common_tags
}
```

---

### 1.7 Set Up GitHub Actions for CI

**Objective:** Create initial CI pipeline for linting and testing.

#### File: `.github/workflows/ci.yml`
```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20'

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Check formatting
        run: npx prettier --check .

  test:
    name: Test
    runs-on: ubuntu-latest
    needs: lint
    strategy:
      matrix:
        service:
          - user-service
          - product-service
          - cart-service
          - order-service
          - payment-service
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests for ${{ matrix.service }}
        run: npm run test --workspace=services/${{ matrix.service }}
        continue-on-error: true

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build all services
        run: npm run build

  terraform-validate:
    name: Terraform Validate
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: infrastructure/terraform/environments/dev
    steps:
      - uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.5.0

      - name: Terraform Init
        run: terraform init -backend=false

      - name: Terraform Validate
        run: terraform validate

      - name: Terraform Format Check
        run: terraform fmt -check -recursive
```

---

## Deliverables Checklist

- [ ] Root `package.json` with workspaces configuration
- [ ] `tsconfig.base.json` with strict TypeScript settings
- [ ] `.eslintrc.json` and `.prettierrc` configuration
- [ ] Husky git hooks configured
- [ ] Directory structure for all services created
- [ ] Terraform modules for networking and ACR
- [ ] Dev environment Terraform configuration
- [ ] GitHub Actions CI workflow
- [ ] `.gitignore` with appropriate exclusions
- [ ] `README.md` with setup instructions

---

## Verification Steps

1. **Run npm install successfully**
   ```bash
   npm install
   ```

2. **Verify TypeScript compilation**
   ```bash
   npx tsc --noEmit
   ```

3. **Run linting without errors**
   ```bash
   npm run lint
   ```

4. **Validate Terraform configuration**
   ```bash
   cd infrastructure/terraform/environments/dev
   terraform init -backend=false
   terraform validate
   ```

5. **GitHub Actions workflow runs successfully on push**

---

## Dependencies on Other Phases

- **None** - This is the foundational phase

## Phases That Depend on This

- Phase 2: Core Backend Services (requires project structure)
- Phase 5: Containerization (requires ACR)
- Phase 7: Azure Infrastructure (requires Terraform modules)
- Phase 8: CI/CD Pipeline (requires GitHub Actions setup)

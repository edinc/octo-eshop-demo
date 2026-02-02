# Phase 1: Project Setup (Local Development Only)

## Overview
Set up the monorepo structure and development tooling for local development. Cloud infrastructure is deferred to Phase 6.

## Prerequisites
- Node.js 20+ installed
- Docker Desktop installed
- Git installed

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

## Deliverables Checklist

- [ ] Root `package.json` with workspaces configuration
- [ ] `tsconfig.base.json` with strict TypeScript settings
- [ ] `.eslintrc.json` and `.prettierrc` configuration
- [ ] Husky git hooks configured
- [ ] Directory structure for all services created
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

---

## Dependencies on Other Phases

- **None** - This is the foundational phase

## Phases That Depend on This

- Phase 2: Core Backend Services (requires project structure)
- Phase 3: Order & Payment Services
- Phase 4: Frontend Development
- Phase 5: Containerization & Local Testing

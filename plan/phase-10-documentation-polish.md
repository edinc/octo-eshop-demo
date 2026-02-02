# Phase 10: Documentation & Polish

## Overview
Complete the project with comprehensive documentation, API specifications, and final testing/optimization.

## Prerequisites
- All previous phases completed
- Services deployed and operational

---

## Tasks

### 10.1 API Documentation with OpenAPI/Swagger

**Objective:** Create comprehensive API documentation for all services.

#### File: `services/user-service/src/docs/openapi.yaml`
```yaml
openapi: 3.0.3
info:
  title: Octo E-Shop User Service API
  description: |
    User authentication and profile management service for the Octo E-Shop bicycle store.
    
    ## Authentication
    Most endpoints require JWT authentication. Include the token in the Authorization header:
    ```
    Authorization: Bearer <token>
    ```
  version: 1.0.0
  contact:
    name: API Support
    email: support@octo-eshop.example.com

servers:
  - url: https://api.octo-eshop.example.com/api/users
    description: Production server
  - url: https://api-staging.octo-eshop.example.com/api/users
    description: Staging server

tags:
  - name: Authentication
    description: User authentication operations
  - name: Profile
    description: User profile management

paths:
  /register:
    post:
      tags:
        - Authentication
      summary: Register a new user
      description: Create a new user account with email and password
      operationId: registerUser
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RegisterRequest'
            example:
              email: "john.doe@example.com"
              password: "SecureP@ss123"
              firstName: "John"
              lastName: "Doe"
      responses:
        '201':
          description: User registered successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RegisterResponse'
        '400':
          description: Invalid input
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '409':
          description: Email already exists
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /login:
    post:
      tags:
        - Authentication
      summary: User login
      description: Authenticate user and return JWT tokens
      operationId: loginUser
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthTokensResponse'
        '401':
          description: Invalid credentials
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /logout:
    post:
      tags:
        - Authentication
      summary: User logout
      description: Invalidate the current session
      operationId: logoutUser
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - refreshToken
              properties:
                refreshToken:
                  type: string
      responses:
        '200':
          description: Logout successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessResponse'
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /refresh-token:
    post:
      tags:
        - Authentication
      summary: Refresh access token
      description: Get new access token using refresh token
      operationId: refreshToken
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - refreshToken
              properties:
                refreshToken:
                  type: string
      responses:
        '200':
          description: Token refreshed successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthTokensResponse'
        '401':
          description: Invalid refresh token
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /profile:
    get:
      tags:
        - Profile
      summary: Get user profile
      description: Retrieve the authenticated user's profile information
      operationId: getProfile
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Profile retrieved successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProfileResponse'
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
    put:
      tags:
        - Profile
      summary: Update user profile
      description: Update the authenticated user's profile information
      operationId: updateProfile
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateProfileRequest'
      responses:
        '200':
          description: Profile updated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProfileResponse'
        '400':
          description: Invalid input
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    RegisterRequest:
      type: object
      required:
        - email
        - password
        - firstName
        - lastName
      properties:
        email:
          type: string
          format: email
          maxLength: 255
        password:
          type: string
          minLength: 8
          maxLength: 128
        firstName:
          type: string
          minLength: 1
          maxLength: 100
        lastName:
          type: string
          minLength: 1
          maxLength: 100

    LoginRequest:
      type: object
      required:
        - email
        - password
      properties:
        email:
          type: string
          format: email
        password:
          type: string

    RegisterResponse:
      type: object
      properties:
        success:
          type: boolean
        data:
          type: object
          properties:
            id:
              type: string
              format: uuid
            email:
              type: string
              format: email

    AuthTokensResponse:
      type: object
      properties:
        success:
          type: boolean
        data:
          type: object
          properties:
            accessToken:
              type: string
            refreshToken:
              type: string
            expiresIn:
              type: integer
              description: Token expiration time in seconds

    ProfileResponse:
      type: object
      properties:
        success:
          type: boolean
        data:
          type: object
          properties:
            id:
              type: string
              format: uuid
            email:
              type: string
              format: email
            firstName:
              type: string
            lastName:
              type: string
            createdAt:
              type: string
              format: date-time
            updatedAt:
              type: string
              format: date-time

    UpdateProfileRequest:
      type: object
      properties:
        firstName:
          type: string
          minLength: 1
          maxLength: 100
        lastName:
          type: string
          minLength: 1
          maxLength: 100

    SuccessResponse:
      type: object
      properties:
        success:
          type: boolean
        data:
          type: object

    ErrorResponse:
      type: object
      properties:
        success:
          type: boolean
          example: false
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
```

---

### 10.2 README Documentation

#### File: `README.md`
```markdown
# Octo E-Shop - Bicycle E-Commerce Platform

A modern microservices-based e-commerce platform for selling bicycles, built with Node.js/TypeScript, React, and deployed on Azure Kubernetes Service (AKS).

## 🚴 Overview

Octo E-Shop is a full-featured online bicycle store featuring:
- User authentication and profiles
- Product catalog with filtering and search
- Shopping cart with real-time updates
- Order management and tracking
- Mock payment processing

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Azure Front Door / CDN                    │
└─────────────────────────────────┬───────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────┐
│                Azure Kubernetes Service (AKS)                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ │
│  │Frontend │ │  User   │ │ Product │ │  Cart   │ │ Order  │ │
│  │ (React) │ │ Service │ │ Service │ │ Service │ │Service │ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └────────┘ │
└─────────────────────────────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────┐
│  PostgreSQL (User, Product, Order) │ Redis (Cart) │ Storage │
└─────────────────────────────────────────────────────────────┘
```

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Tailwind CSS, Vite |
| Backend | Node.js, TypeScript, Express, Prisma |
| Databases | PostgreSQL, Redis |
| Infrastructure | Azure AKS, ACR, Key Vault |
| IaC | Terraform |
| CI/CD | GitHub Actions |
| Containerization | Docker, Kubernetes |

## 📁 Project Structure

```
octo-eshop-demo/
├── services/
│   ├── frontend/          # React SPA
│   ├── user-service/      # Authentication & profiles
│   ├── product-service/   # Product catalog
│   ├── cart-service/      # Shopping cart
│   ├── order-service/     # Order management
│   └── payment-service/   # Mock payments
├── shared/
│   ├── types/             # Shared TypeScript types
│   └── utils/             # Shared utilities
├── infrastructure/
│   └── terraform/         # Azure infrastructure
├── kubernetes/
│   ├── base/              # Base K8s manifests
│   └── overlays/          # Environment configs
├── .github/
│   └── workflows/         # CI/CD pipelines
└── plan/                  # Implementation plans
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker Desktop
- kubectl
- Terraform 1.5+
- Azure CLI

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/octo-eshop-demo.git
   cd octo-eshop-demo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Run database migrations**
   ```bash
   docker-compose exec user-service npx prisma migrate deploy
   docker-compose exec product-service npx prisma migrate deploy
   docker-compose exec order-service npx prisma migrate deploy
   ```

5. **Seed product data**
   ```bash
   docker-compose exec product-service npx prisma db seed
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - API Gateway: http://localhost:8080

### Running Tests

```bash
# Run all tests
npm test

# Run tests for a specific service
npm test --workspace=services/user-service

# Run tests with coverage
npm test -- --coverage
```

### Building for Production

```bash
# Build all services
npm run build

# Build Docker images
./scripts/build-images.sh
```

## 🌐 API Documentation

API documentation is available at:
- **Production**: https://api.octo-eshop.example.com/docs
- **Staging**: https://api-staging.octo-eshop.example.com/docs

### Authentication

Most API endpoints require JWT authentication:

```bash
# Login to get tokens
curl -X POST https://api.octo-eshop.example.com/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Use token in subsequent requests
curl https://api.octo-eshop.example.com/api/users/profile \
  -H "Authorization: Bearer <access_token>"
```

## 🏭 Deployment

### Deploy to Azure

1. **Initialize Terraform**
   ```bash
   cd infrastructure/terraform/environments/dev
   terraform init
   ```

2. **Deploy infrastructure**
   ```bash
   terraform plan -out=tfplan
   terraform apply tfplan
   ```

3. **Configure kubectl**
   ```bash
   az aks get-credentials --resource-group octoeshop-dev-rg --name octoeshop-dev-aks
   ```

4. **Deploy to Kubernetes**
   ```bash
   kubectl apply -k kubernetes/overlays/dev
   ```

### CI/CD Pipeline

The project uses GitHub Actions for CI/CD:

- **CI Pipeline**: Runs on all PRs - lint, test, build
- **Build Pipeline**: Builds and pushes Docker images on merge to main/develop
- **Deploy Pipeline**: Automatically deploys to dev/staging environments
- **Production Deploy**: Manual trigger with approval required

## 📊 Monitoring

- **Azure Monitor**: Metrics and logs for all services
- **Application Insights**: APM and distributed tracing
- **Prometheus**: Custom metrics via /metrics endpoint

Access dashboards:
- Azure Portal: https://portal.azure.com
- Grafana (if configured): https://grafana.octo-eshop.example.com

## 🔒 Security

- JWT-based authentication with refresh tokens
- Rate limiting on all API endpoints
- Network policies in Kubernetes
- Secrets managed via Azure Key Vault
- TLS/HTTPS enforced

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow TypeScript strict mode
- Use ESLint and Prettier for formatting
- Write tests for new features
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Documentation**: [docs.octo-eshop.example.com](https://docs.octo-eshop.example.com)
- **Issues**: [GitHub Issues](https://github.com/your-org/octo-eshop-demo/issues)
- **Email**: support@octo-eshop.example.com
```

---

### 10.3 Architecture Decision Records (ADRs)

#### File: `docs/adr/001-microservices-architecture.md`
```markdown
# ADR 001: Microservices Architecture

## Status
Accepted

## Context
We need to build an e-commerce platform for selling bicycles. The system needs to be scalable, maintainable, and allow independent deployment of components.

## Decision
We will use a microservices architecture with the following services:
- User Service: Authentication and user management
- Product Service: Product catalog management
- Cart Service: Shopping cart (using Redis)
- Order Service: Order processing and management
- Payment Service: Payment processing (mock for MVP)

## Consequences

### Positive
- Independent scaling of services based on load
- Technology flexibility per service
- Easier to maintain and update individual services
- Better fault isolation

### Negative
- Increased operational complexity
- Need for service discovery and communication patterns
- Distributed transactions are more complex
- Higher infrastructure costs

## Alternatives Considered
1. **Monolithic architecture**: Simpler but less scalable
2. **Serverless**: Lower cost but cold start issues for API responses
```

#### File: `docs/adr/002-database-per-service.md`
```markdown
# ADR 002: Database Per Service Pattern

## Status
Accepted

## Context
Each microservice needs data storage. We need to decide whether to share databases or use separate databases per service.

## Decision
Each service will have its own database:
- User Service: PostgreSQL (userdb)
- Product Service: PostgreSQL (productdb)
- Cart Service: Redis
- Order Service: PostgreSQL (orderdb)

## Consequences

### Positive
- Services are loosely coupled
- Each service can choose the best database for its needs
- Independent scaling of databases
- No schema conflicts between services

### Negative
- Data duplication may occur
- Cross-service queries require API calls
- More complex backup and recovery procedures
- Higher infrastructure costs
```

---

### 10.4 Performance Testing

#### File: `tests/performance/load-test.js`
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const productListTrend = new Trend('product_list_duration');
const productDetailTrend = new Trend('product_detail_duration');

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '3m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '3m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    errors: ['rate<0.1'],              // Error rate should be below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  // Test product listing
  const listResponse = http.get(`${BASE_URL}/api/products?limit=20`);
  productListTrend.add(listResponse.timings.duration);
  
  check(listResponse, {
    'product list status is 200': (r) => r.status === 200,
    'product list has data': (r) => JSON.parse(r.body).data.length > 0,
  }) || errorRate.add(1);

  sleep(1);

  // Test product detail (assuming products exist)
  const products = JSON.parse(listResponse.body).data;
  if (products.length > 0) {
    const productId = products[Math.floor(Math.random() * products.length)].id;
    const detailResponse = http.get(`${BASE_URL}/api/products/${productId}`);
    productDetailTrend.add(detailResponse.timings.duration);
    
    check(detailResponse, {
      'product detail status is 200': (r) => r.status === 200,
      'product has name': (r) => JSON.parse(r.body).data.name !== undefined,
    }) || errorRate.add(1);
  }

  sleep(2);
}

export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const { indent = '', enableColors = false } = options;
  
  return `
${indent}Performance Test Summary
${indent}========================
${indent}Total Requests: ${data.metrics.http_reqs.values.count}
${indent}Average Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
${indent}95th Percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
${indent}Error Rate: ${(data.metrics.errors?.values?.rate || 0).toFixed(2)}%
  `;
}
```

---

### 10.5 Runbooks

#### File: `docs/runbooks/incident-response.md`
```markdown
# Incident Response Runbook

## Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| SEV1 | Critical - Service Down | < 15 min | All services unavailable, data loss |
| SEV2 | Major - Degraded | < 1 hour | One service down, high error rate |
| SEV3 | Minor - Impact Limited | < 4 hours | Performance issues, partial outage |
| SEV4 | Low - No Impact | Next business day | Warnings, non-urgent issues |

## Common Issues

### High CPU on AKS Nodes

**Symptoms:**
- Pods pending due to insufficient CPU
- High latency on requests
- HPA scaling to max replicas

**Diagnosis:**
```bash
# Check node resource usage
kubectl top nodes

# Check pod resource usage
kubectl top pods -n octo-eshop

# Check HPA status
kubectl get hpa -n octo-eshop
```

**Resolution:**
1. Scale node pool if needed:
   ```bash
   az aks nodepool scale --cluster-name octoeshop-prod-aks \
     --name default --node-count 5 --resource-group octoeshop-prod-rg
   ```
2. Review and optimize resource-intensive pods
3. Consider vertical pod autoscaling

### Database Connection Errors

**Symptoms:**
- 500 errors from services
- "Connection refused" in logs
- High database connection count

**Diagnosis:**
```bash
# Check service logs
kubectl logs -l app=user-service -n octo-eshop --tail=100

# Check database metrics in Azure Portal
```

**Resolution:**
1. Check database status in Azure Portal
2. Verify network connectivity
3. Restart affected pods:
   ```bash
   kubectl rollout restart deployment/user-service -n octo-eshop
   ```

### Pod CrashLoopBackOff

**Symptoms:**
- Pod status shows CrashLoopBackOff
- Service unavailable

**Diagnosis:**
```bash
# Get pod events
kubectl describe pod <pod-name> -n octo-eshop

# Get pod logs
kubectl logs <pod-name> -n octo-eshop --previous
```

**Resolution:**
1. Check logs for error messages
2. Verify environment variables and secrets
3. Check resource limits
4. Rollback if recent deployment:
   ```bash
   kubectl rollout undo deployment/<deployment-name> -n octo-eshop
   ```

## Escalation Path

1. On-call engineer
2. Team lead
3. Engineering manager
4. CTO

## Communication

- **Internal**: #incident-response Slack channel
- **Status Page**: https://status.octo-eshop.example.com
- **Customer Comms**: support@octo-eshop.example.com
```

---

## Deliverables Checklist

### API Documentation
- [ ] OpenAPI/Swagger specs for all services
- [ ] API reference documentation
- [ ] Authentication guide
- [ ] Error code reference

### Project Documentation
- [ ] README.md with quick start guide
- [ ] CONTRIBUTING.md guidelines
- [ ] Architecture overview
- [ ] Deployment guide

### Technical Documentation
- [ ] Architecture Decision Records (ADRs)
- [ ] Service dependency diagram
- [ ] Database schema documentation
- [ ] Infrastructure diagram

### Operational Documentation
- [ ] Runbooks for common issues
- [ ] Incident response procedures
- [ ] Monitoring and alerting guide
- [ ] Backup and recovery procedures

### Testing
- [ ] Performance test scripts (k6)
- [ ] Load testing results
- [ ] Security scan results
- [ ] Test coverage reports

### Final Polish
- [ ] Code review of all services
- [ ] Remove unused dependencies
- [ ] Update all package versions
- [ ] Final security audit
- [ ] Performance optimization

---

## Dependencies

**Depends on:**
- All previous phases completed

**Delivers:**
- Production-ready e-commerce platform
- Complete documentation
- Operational procedures

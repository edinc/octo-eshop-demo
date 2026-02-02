# Phase 8: CI/CD Pipeline

## Overview
Create GitHub Actions workflows for continuous integration, building/pushing Docker images, and automated deployment to AKS environments.

## Prerequisites
- Phase 5 completed (Dockerfiles ready)
- Phase 6 completed (Kubernetes manifests ready)
- Phase 7 completed (Azure infrastructure deployed)
- GitHub repository created
- Azure service principal for GitHub Actions

---

## Tasks

### 8.1 GitHub Actions Secrets Setup

**Objective:** Configure required secrets in GitHub repository settings.

#### Required Secrets:
```
AZURE_CREDENTIALS          # Azure service principal JSON
AZURE_SUBSCRIPTION_ID      # Azure subscription ID
AZURE_TENANT_ID            # Azure tenant ID
ACR_LOGIN_SERVER           # e.g., octoeshopdevacr.azurecr.io
ACR_USERNAME               # ACR admin username
ACR_PASSWORD               # ACR admin password
AKS_CLUSTER_NAME           # e.g., octoeshop-dev-aks
AKS_RESOURCE_GROUP         # e.g., octoeshop-dev-rg
KUBE_CONFIG_DEV            # Base64 encoded kubeconfig for dev
KUBE_CONFIG_STAGING        # Base64 encoded kubeconfig for staging
KUBE_CONFIG_PRODUCTION     # Base64 encoded kubeconfig for production
SLACK_WEBHOOK_URL          # Optional: for notifications
```

#### Create Azure Service Principal:
```bash
az ad sp create-for-rbac \
  --name "octo-eshop-github-actions" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/octoeshop-dev-rg \
  --sdk-auth
```

---

### 8.2 CI Pipeline

#### File: `.github/workflows/ci.yml`
```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop, 'feature/**']
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20'

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ===================
  # Code Quality
  # ===================
  lint:
    name: Lint & Format
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Check Prettier formatting
        run: npx prettier --check .

  # ===================
  # Unit Tests
  # ===================
  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: lint
    strategy:
      fail-fast: false
      matrix:
        service:
          - user-service
          - product-service
          - cart-service
          - order-service
          - payment-service
          - frontend
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests for ${{ matrix.service }}
        run: npm run test --workspace=services/${{ matrix.service }} -- --coverage
        continue-on-error: false

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-${{ matrix.service }}
          path: services/${{ matrix.service }}/coverage/
          retention-days: 7

  # ===================
  # Build Check
  # ===================
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build all services
        run: npm run build

  # ===================
  # Security Scan
  # ===================
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: npm audit --audit-level=high
        continue-on-error: true

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  # ===================
  # Docker Build Test
  # ===================
  docker-build:
    name: Docker Build Test
    runs-on: ubuntu-latest
    needs: [test, build]
    if: github.event_name == 'pull_request'
    strategy:
      fail-fast: false
      matrix:
        service:
          - user-service
          - product-service
          - cart-service
          - order-service
          - payment-service
          - frontend
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: services/${{ matrix.service }}/Dockerfile
          push: false
          tags: ${{ matrix.service }}:test
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ===================
  # Terraform Validate
  # ===================
  terraform:
    name: Terraform Validate
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: infrastructure/terraform/environments/dev
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.5.0

      - name: Terraform Init
        run: terraform init -backend=false

      - name: Terraform Validate
        run: terraform validate

      - name: Terraform Format Check
        run: terraform fmt -check -recursive ../../

  # ===================
  # Kubernetes Validate
  # ===================
  kubernetes:
    name: Kubernetes Validate
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup kubectl
        uses: azure/setup-kubectl@v3

      - name: Validate dev overlay
        run: |
          kubectl kustomize kubernetes/overlays/dev > /dev/null

      - name: Validate staging overlay
        run: |
          kubectl kustomize kubernetes/overlays/staging > /dev/null

      - name: Validate production overlay
        run: |
          kubectl kustomize kubernetes/overlays/production > /dev/null
```

---

### 8.3 Build and Push Pipeline

#### File: `.github/workflows/build-push.yml`
```yaml
name: Build and Push Images

on:
  push:
    branches: [main, develop]
    paths:
      - 'services/**'
      - 'shared/**'
      - '.github/workflows/build-push.yml'

env:
  ACR_REGISTRY: ${{ secrets.ACR_LOGIN_SERVER }}

jobs:
  # Detect which services changed
  changes:
    name: Detect Changes
    runs-on: ubuntu-latest
    outputs:
      user-service: ${{ steps.filter.outputs.user-service }}
      product-service: ${{ steps.filter.outputs.product-service }}
      cart-service: ${{ steps.filter.outputs.cart-service }}
      order-service: ${{ steps.filter.outputs.order-service }}
      payment-service: ${{ steps.filter.outputs.payment-service }}
      frontend: ${{ steps.filter.outputs.frontend }}
      shared: ${{ steps.filter.outputs.shared }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v2
        id: filter
        with:
          filters: |
            user-service:
              - 'services/user-service/**'
            product-service:
              - 'services/product-service/**'
            cart-service:
              - 'services/cart-service/**'
            order-service:
              - 'services/order-service/**'
            payment-service:
              - 'services/payment-service/**'
            frontend:
              - 'services/frontend/**'
            shared:
              - 'shared/**'

  # Build and push images
  build-push:
    name: Build ${{ matrix.service }}
    runs-on: ubuntu-latest
    needs: changes
    strategy:
      fail-fast: false
      matrix:
        include:
          - service: user-service
            changed: ${{ needs.changes.outputs.user-service == 'true' || needs.changes.outputs.shared == 'true' }}
          - service: product-service
            changed: ${{ needs.changes.outputs.product-service == 'true' || needs.changes.outputs.shared == 'true' }}
          - service: cart-service
            changed: ${{ needs.changes.outputs.cart-service == 'true' || needs.changes.outputs.shared == 'true' }}
          - service: order-service
            changed: ${{ needs.changes.outputs.order-service == 'true' || needs.changes.outputs.shared == 'true' }}
          - service: payment-service
            changed: ${{ needs.changes.outputs.payment-service == 'true' || needs.changes.outputs.shared == 'true' }}
          - service: frontend
            changed: ${{ needs.changes.outputs.frontend == 'true' || needs.changes.outputs.shared == 'true' }}
    if: ${{ matrix.changed == 'true' }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Azure Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.ACR_REGISTRY }}
          username: ${{ secrets.ACR_USERNAME }}
          password: ${{ secrets.ACR_PASSWORD }}

      - name: Generate image tags
        id: tags
        run: |
          SHA_SHORT=$(git rev-parse --short HEAD)
          BRANCH=${GITHUB_REF_NAME}
          
          if [ "$BRANCH" == "main" ]; then
            TAGS="${{ env.ACR_REGISTRY }}/${{ matrix.service }}:latest,${{ env.ACR_REGISTRY }}/${{ matrix.service }}:${SHA_SHORT}"
          else
            TAGS="${{ env.ACR_REGISTRY }}/${{ matrix.service }}:${BRANCH}-${SHA_SHORT},${{ env.ACR_REGISTRY }}/${{ matrix.service }}:${BRANCH}"
          fi
          
          echo "tags=${TAGS}" >> $GITHUB_OUTPUT
          echo "sha_short=${SHA_SHORT}" >> $GITHUB_OUTPUT

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: services/${{ matrix.service }}/Dockerfile
          push: true
          tags: ${{ steps.tags.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          labels: |
            org.opencontainers.image.source=${{ github.server_url }}/${{ github.repository }}
            org.opencontainers.image.revision=${{ github.sha }}

      - name: Scan image for vulnerabilities
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: '${{ env.ACR_REGISTRY }}/${{ matrix.service }}:${{ steps.tags.outputs.sha_short }}'
          format: 'sarif'
          output: 'trivy-results.sarif'
        continue-on-error: true

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'
        continue-on-error: true

  # Trigger deployment after successful build
  trigger-deploy:
    name: Trigger Deployment
    runs-on: ubuntu-latest
    needs: build-push
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    steps:
      - name: Trigger deployment workflow
        uses: peter-evans/repository-dispatch@v2
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          event-type: deploy
          client-payload: '{"ref": "${{ github.ref }}", "sha": "${{ github.sha }}", "environment": "${{ github.ref == ''refs/heads/main'' && ''staging'' || ''dev'' }}"}'
```

---

### 8.4 Deployment Pipeline

#### File: `.github/workflows/deploy.yml`
```yaml
name: Deploy to Environment

on:
  repository_dispatch:
    types: [deploy]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        type: choice
        options:
          - dev
          - staging
          - production
      image_tag:
        description: 'Image tag to deploy (default: latest)'
        required: false
        default: 'latest'

env:
  ACR_REGISTRY: ${{ secrets.ACR_LOGIN_SERVER }}

jobs:
  deploy:
    name: Deploy to ${{ github.event.inputs.environment || github.event.client_payload.environment }}
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment || github.event.client_payload.environment }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set environment variables
        id: env
        run: |
          ENV=${{ github.event.inputs.environment || github.event.client_payload.environment }}
          TAG=${{ github.event.inputs.image_tag || 'latest' }}
          
          echo "environment=${ENV}" >> $GITHUB_OUTPUT
          echo "image_tag=${TAG}" >> $GITHUB_OUTPUT
          echo "namespace=octo-eshop-${ENV}" >> $GITHUB_OUTPUT

      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Get AKS credentials
        run: |
          az aks get-credentials \
            --resource-group ${{ secrets.AKS_RESOURCE_GROUP }} \
            --name ${{ secrets.AKS_CLUSTER_NAME }} \
            --overwrite-existing

      - name: Setup kubectl
        uses: azure/setup-kubectl@v3

      - name: Create namespace if not exists
        run: |
          kubectl create namespace ${{ steps.env.outputs.namespace }} --dry-run=client -o yaml | kubectl apply -f -

      - name: Update image tags in Kustomization
        run: |
          cd kubernetes/overlays/${{ steps.env.outputs.environment }}
          
          # Update image tags
          kustomize edit set image \
            ${{ env.ACR_REGISTRY }}/user-service=${{ env.ACR_REGISTRY }}/user-service:${{ steps.env.outputs.image_tag }} \
            ${{ env.ACR_REGISTRY }}/product-service=${{ env.ACR_REGISTRY }}/product-service:${{ steps.env.outputs.image_tag }} \
            ${{ env.ACR_REGISTRY }}/cart-service=${{ env.ACR_REGISTRY }}/cart-service:${{ steps.env.outputs.image_tag }} \
            ${{ env.ACR_REGISTRY }}/order-service=${{ env.ACR_REGISTRY }}/order-service:${{ steps.env.outputs.image_tag }} \
            ${{ env.ACR_REGISTRY }}/payment-service=${{ env.ACR_REGISTRY }}/payment-service:${{ steps.env.outputs.image_tag }} \
            ${{ env.ACR_REGISTRY }}/frontend=${{ env.ACR_REGISTRY }}/frontend:${{ steps.env.outputs.image_tag }}

      - name: Deploy with Kustomize
        run: |
          kubectl apply -k kubernetes/overlays/${{ steps.env.outputs.environment }}

      - name: Wait for deployments
        run: |
          NAMESPACE=${{ steps.env.outputs.namespace }}
          
          for deployment in user-service product-service cart-service order-service payment-service frontend; do
            echo "Waiting for ${deployment}..."
            kubectl rollout status deployment/${deployment} -n ${NAMESPACE} --timeout=300s || true
          done

      - name: Verify deployment
        run: |
          NAMESPACE=${{ steps.env.outputs.namespace }}
          
          echo "=== Pods ==="
          kubectl get pods -n ${NAMESPACE}
          
          echo "=== Services ==="
          kubectl get services -n ${NAMESPACE}
          
          echo "=== Ingress ==="
          kubectl get ingress -n ${NAMESPACE}

      - name: Run smoke tests
        if: steps.env.outputs.environment != 'production'
        run: |
          # Wait for ingress to be ready
          sleep 30
          
          # Get ingress IP
          INGRESS_IP=$(kubectl get ingress -n ${{ steps.env.outputs.namespace }} -o jsonpath='{.items[0].status.loadBalancer.ingress[0].ip}')
          
          if [ -n "$INGRESS_IP" ]; then
            # Test health endpoints
            curl -sf "http://${INGRESS_IP}/health" || echo "Frontend health check failed"
            curl -sf "http://${INGRESS_IP}/api/products?limit=1" || echo "Products API check failed"
          fi
        continue-on-error: true

      - name: Notify on success
        if: success()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "✅ Deployment to ${{ steps.env.outputs.environment }} succeeded",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "✅ *Deployment Successful*\n*Environment:* ${{ steps.env.outputs.environment }}\n*Image Tag:* ${{ steps.env.outputs.image_tag }}\n*Commit:* ${{ github.sha }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
        continue-on-error: true

      - name: Notify on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "❌ Deployment to ${{ steps.env.outputs.environment }} failed",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "❌ *Deployment Failed*\n*Environment:* ${{ steps.env.outputs.environment }}\n*Commit:* ${{ github.sha }}\n*Run:* ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
        continue-on-error: true
```

---

### 8.5 Production Deployment with Approval

#### File: `.github/workflows/deploy-production.yml`
```yaml
name: Deploy to Production

on:
  workflow_dispatch:
    inputs:
      image_tag:
        description: 'Image tag to deploy'
        required: true
        default: 'latest'
      confirm:
        description: 'Type "DEPLOY" to confirm production deployment'
        required: true

env:
  ACR_REGISTRY: ${{ secrets.ACR_LOGIN_SERVER }}

jobs:
  validate:
    name: Validate Deployment
    runs-on: ubuntu-latest
    steps:
      - name: Validate confirmation
        if: github.event.inputs.confirm != 'DEPLOY'
        run: |
          echo "::error::You must type 'DEPLOY' to confirm production deployment"
          exit 1

  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: validate
    environment: production
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Get AKS credentials
        run: |
          az aks get-credentials \
            --resource-group ${{ secrets.AKS_RESOURCE_GROUP_PROD }} \
            --name ${{ secrets.AKS_CLUSTER_NAME_PROD }} \
            --overwrite-existing

      - name: Setup kubectl
        uses: azure/setup-kubectl@v3

      - name: Pre-deployment checks
        run: |
          echo "=== Current deployment status ==="
          kubectl get deployments -n octo-eshop-prod
          
          echo "=== Current pod status ==="
          kubectl get pods -n octo-eshop-prod

      - name: Deploy with Kustomize
        run: |
          cd kubernetes/overlays/production
          
          kustomize edit set image \
            ${{ env.ACR_REGISTRY }}/user-service=${{ env.ACR_REGISTRY }}/user-service:${{ github.event.inputs.image_tag }} \
            ${{ env.ACR_REGISTRY }}/product-service=${{ env.ACR_REGISTRY }}/product-service:${{ github.event.inputs.image_tag }} \
            ${{ env.ACR_REGISTRY }}/cart-service=${{ env.ACR_REGISTRY }}/cart-service:${{ github.event.inputs.image_tag }} \
            ${{ env.ACR_REGISTRY }}/order-service=${{ env.ACR_REGISTRY }}/order-service:${{ github.event.inputs.image_tag }} \
            ${{ env.ACR_REGISTRY }}/payment-service=${{ env.ACR_REGISTRY }}/payment-service:${{ github.event.inputs.image_tag }} \
            ${{ env.ACR_REGISTRY }}/frontend=${{ env.ACR_REGISTRY }}/frontend:${{ github.event.inputs.image_tag }}
          
          kubectl apply -k .

      - name: Wait for rollout
        run: |
          for deployment in user-service product-service cart-service order-service payment-service frontend; do
            echo "Waiting for ${deployment}..."
            kubectl rollout status deployment/prod-${deployment} -n octo-eshop-prod --timeout=600s
          done

      - name: Verify deployment
        run: |
          kubectl get pods -n octo-eshop-prod
          kubectl get services -n octo-eshop-prod

      - name: Create deployment record
        run: |
          echo "Deployed at: $(date -u)" >> deployment-record.txt
          echo "Image tag: ${{ github.event.inputs.image_tag }}" >> deployment-record.txt
          echo "Deployed by: ${{ github.actor }}" >> deployment-record.txt

      - name: Upload deployment record
        uses: actions/upload-artifact@v4
        with:
          name: deployment-record
          path: deployment-record.txt
```

---

### 8.6 Rollback Workflow

#### File: `.github/workflows/rollback.yml`
```yaml
name: Rollback Deployment

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to rollback'
        required: true
        type: choice
        options:
          - dev
          - staging
          - production
      service:
        description: 'Service to rollback (or "all")'
        required: true
        default: 'all'
      revision:
        description: 'Revision to rollback to (leave empty for previous)'
        required: false

jobs:
  rollback:
    name: Rollback ${{ github.event.inputs.service }} in ${{ github.event.inputs.environment }}
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}
    steps:
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Get AKS credentials
        run: |
          az aks get-credentials \
            --resource-group ${{ secrets.AKS_RESOURCE_GROUP }} \
            --name ${{ secrets.AKS_CLUSTER_NAME }} \
            --overwrite-existing

      - name: Setup kubectl
        uses: azure/setup-kubectl@v3

      - name: Rollback deployment
        run: |
          NAMESPACE="octo-eshop-${{ github.event.inputs.environment }}"
          SERVICE="${{ github.event.inputs.service }}"
          REVISION="${{ github.event.inputs.revision }}"
          
          if [ "$SERVICE" == "all" ]; then
            SERVICES="user-service product-service cart-service order-service payment-service frontend"
          else
            SERVICES="$SERVICE"
          fi
          
          for svc in $SERVICES; do
            echo "Rolling back ${svc}..."
            if [ -n "$REVISION" ]; then
              kubectl rollout undo deployment/${svc} -n ${NAMESPACE} --to-revision=${REVISION}
            else
              kubectl rollout undo deployment/${svc} -n ${NAMESPACE}
            fi
          done

      - name: Wait for rollback
        run: |
          NAMESPACE="octo-eshop-${{ github.event.inputs.environment }}"
          SERVICE="${{ github.event.inputs.service }}"
          
          if [ "$SERVICE" == "all" ]; then
            SERVICES="user-service product-service cart-service order-service payment-service frontend"
          else
            SERVICES="$SERVICE"
          fi
          
          for svc in $SERVICES; do
            kubectl rollout status deployment/${svc} -n ${NAMESPACE} --timeout=300s
          done

      - name: Verify rollback
        run: |
          NAMESPACE="octo-eshop-${{ github.event.inputs.environment }}"
          kubectl get pods -n ${NAMESPACE}
```

---

### 8.7 Branch Protection Rules

Configure in GitHub repository settings:

**For `main` branch:**
- Require pull request reviews (1 approval minimum)
- Require status checks to pass:
  - `lint`
  - `test`
  - `build`
  - `security`
  - `terraform`
  - `kubernetes`
- Require branches to be up to date
- Include administrators
- Restrict who can push (maintainers only)

**For `develop` branch:**
- Require pull request reviews (1 approval)
- Require status checks to pass
- Allow force pushes for admins (for rebasing)

---

## Deliverables Checklist

- [ ] CI workflow with lint, test, build, security scan
- [ ] Build and push workflow with change detection
- [ ] Deployment workflow for dev/staging
- [ ] Production deployment workflow with approval
- [ ] Rollback workflow
- [ ] GitHub secrets configured
- [ ] Branch protection rules configured
- [ ] Slack/Teams notifications (optional)
- [ ] Docker image vulnerability scanning
- [ ] All workflows pass on test run

---

## Dependencies

**Depends on:**
- Phase 5: Dockerfiles
- Phase 6: Kubernetes manifests
- Phase 7: Azure infrastructure

**Required by:**
- Phase 9: Observability (monitoring deployments)
- Phase 10: Documentation (CI/CD docs)

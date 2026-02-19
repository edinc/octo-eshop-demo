# Azure Architecture

> Infrastructure and deployment architecture for the Octo E-Shop platform on Microsoft Azure.

![Azure Architecture](azure-architecture.png)

## Overview

The Octo E-Shop platform runs on **Azure Kubernetes Service (AKS)** with a full suite of managed Azure services. Infrastructure is provisioned via **Terraform** and deployed across three environments: dev, staging, and production.

## Azure Services

| Service                                        | Purpose                                                 |
| ---------------------------------------------- | ------------------------------------------------------- |
| **Azure Kubernetes Service (AKS)**             | Container orchestration for all microservices           |
| **Azure Container Registry (ACR)**             | Private Docker image registry                           |
| **Azure Database for PostgreSQL**              | Managed databases for user, product, and order services |
| **Azure Cache for Redis**                      | Session and cart data store                             |
| **Azure Service Bus**                          | Asynchronous messaging between services                 |
| **Azure Key Vault**                            | Secrets and certificate management                      |
| **Azure Storage Account**                      | Terraform state backend and static assets               |
| **Azure Log Analytics & Application Insights** | Monitoring, logging, and diagnostics                    |
| **Network Security Groups (NSG)**              | Network-level access control                            |
| **Azure Load Balancer**                        | Public ingress for the frontend                         |

## Network Architecture

Each environment is deployed into its own **Virtual Network (VNet)** with dedicated subnets:

| Subnet          | CIDR (Dev)    | Purpose                                 |
| --------------- | ------------- | --------------------------------------- |
| AKS Subnet      | `10.0.1.0/24` | Kubernetes node pool                    |
| Database Subnet | `10.0.2.0/24` | PostgreSQL flexible servers (delegated) |
| Redis Subnet    | `10.0.3.0/24` | Azure Cache for Redis                   |

**Network Policies** (Kubernetes-level) restrict pod-to-pod communication and egress to database subnets. **NSG rules** control network-level access at the Azure layer.

## Environment Sizing

| Resource   | Dev                 | Staging             | Production                             |
| ---------- | ------------------- | ------------------- | -------------------------------------- |
| AKS Nodes  | 1 × Standard_D2s_v3 | 2 × Standard_D2s_v3 | 3 × Standard_D4s_v3                    |
| PostgreSQL | B_Standard_B1ms     | B_Standard_B1ms     | GP_Standard_D4s_v3 (Zone Redundant HA) |
| Redis      | Basic/C0            | Basic/C0            | Premium/P1                             |
| ACR        | Basic               | Standard            | Premium                                |

## Infrastructure as Code

All infrastructure is managed with **Terraform** using a modular structure:

```
infrastructure/terraform/
├── modules/
│   ├── aks/            # Kubernetes cluster
│   ├── acr/            # Container registry
│   ├── postgresql/     # Database servers
│   ├── redis/          # Cache instances
│   ├── networking/     # VNet, subnets, NSGs
│   ├── keyvault/       # Secrets management
│   ├── servicebus/     # Message bus
│   ├── storage/        # Storage accounts
│   └── monitoring/     # Log Analytics + App Insights
└── environments/
    ├── dev/
    ├── staging/
    └── production/
```

State is stored remotely in **Azure Storage** with Azure AD authentication.

### Provisioning

```bash
# Plan changes (safe — no modifications)
gh workflow run infrastructure.yml -f environment=dev -f action=plan

# Apply after reviewing
gh workflow run infrastructure.yml -f environment=dev -f action=apply
```

## Deployment Flow

Services are deployed to AKS via **Helm charts** through the CI/CD pipeline:

1. Code merged to `main` triggers build
2. Docker images pushed to ACR
3. Helm upgrade/install to AKS namespaces
4. Kubernetes secrets injected via `kubectl`
5. Rolling update with health checks

See [CI/CD Pipeline Documentation](cicd-pipeline.md) for full details.

## Security

- **Secrets**: Stored in Azure Key Vault, synced to GitHub Environment secrets, injected as Kubernetes secrets at deploy time
- **Network**: NSG rules + Kubernetes NetworkPolicies restrict traffic
- **Registry**: ACR admin credentials scoped per environment
- **Authentication**: Service principal with least-privilege RBAC
- **Scanning**: Trivy container vulnerability scanning in CI pipeline

# Phase 7: Azure Infrastructure with Terraform

## Overview
Deploy all Azure resources using Terraform, including AKS cluster, databases, Redis cache, Key Vault, and supporting services.

## Prerequisites
- Phase 1 completed (Terraform modules created)
- Azure CLI installed and authenticated
- Azure subscription with appropriate permissions
- Terraform 1.5+ installed

---

## Tasks

### 7.1 Terraform Provider Configuration

#### File: `infrastructure/terraform/environments/dev/providers.tf`
```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.85.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.47.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "octoeshop-tfstate-rg"
    storage_account_name = "octoeshoptfstate"
    container_name       = "tfstate"
    key                  = "dev.terraform.tfstate"
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
    }
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}

provider "azuread" {}
```

---

### 7.2 Main Infrastructure Configuration

#### File: `infrastructure/terraform/environments/dev/main.tf`
```hcl
locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Team        = "Platform"
  }
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "${var.project_name}-${var.environment}-rg"
  location = var.location
  tags     = local.common_tags
}

# Networking Module
module "networking" {
  source = "../../modules/networking"

  project_name           = var.project_name
  environment            = var.environment
  location               = var.location
  resource_group_name    = azurerm_resource_group.main.name
  vnet_address_space     = var.vnet_address_space
  aks_subnet_prefix      = var.aks_subnet_prefix
  database_subnet_prefix = var.database_subnet_prefix
  redis_subnet_prefix    = var.redis_subnet_prefix
  tags                   = local.common_tags
}

# Azure Container Registry
module "acr" {
  source = "../../modules/acr"

  project_name        = var.project_name
  environment         = var.environment
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = var.acr_sku
  tags                = local.common_tags
}

# Azure Kubernetes Service
module "aks" {
  source = "../../modules/aks"

  project_name               = var.project_name
  environment                = var.environment
  location                   = var.location
  resource_group_name        = azurerm_resource_group.main.name
  kubernetes_version         = var.kubernetes_version
  node_count                 = var.aks_node_count
  node_vm_size               = var.aks_node_vm_size
  vnet_subnet_id             = module.networking.aks_subnet_id
  acr_id                     = module.acr.acr_id
  log_analytics_workspace_id = module.monitoring.log_analytics_workspace_id
  tags                       = local.common_tags
}

# PostgreSQL for User Service
module "postgresql_user" {
  source = "../../modules/postgresql"

  name                = "${var.project_name}-${var.environment}-user-db"
  project_name        = var.project_name
  environment         = var.environment
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  delegated_subnet_id = module.networking.database_subnet_id
  private_dns_zone_id = module.networking.postgresql_private_dns_zone_id
  sku_name            = var.postgresql_sku
  storage_mb          = var.postgresql_storage_mb
  database_name       = "userdb"
  administrator_login = "pgadmin"
  tags                = local.common_tags
}

# PostgreSQL for Product Service
module "postgresql_product" {
  source = "../../modules/postgresql"

  name                = "${var.project_name}-${var.environment}-product-db"
  project_name        = var.project_name
  environment         = var.environment
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  delegated_subnet_id = module.networking.database_subnet_id
  private_dns_zone_id = module.networking.postgresql_private_dns_zone_id
  sku_name            = var.postgresql_sku
  storage_mb          = var.postgresql_storage_mb
  database_name       = "productdb"
  administrator_login = "pgadmin"
  tags                = local.common_tags
}

# PostgreSQL for Order Service
module "postgresql_order" {
  source = "../../modules/postgresql"

  name                = "${var.project_name}-${var.environment}-order-db"
  project_name        = var.project_name
  environment         = var.environment
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  delegated_subnet_id = module.networking.database_subnet_id
  private_dns_zone_id = module.networking.postgresql_private_dns_zone_id
  sku_name            = var.postgresql_sku
  storage_mb          = var.postgresql_storage_mb
  database_name       = "orderdb"
  administrator_login = "pgadmin"
  tags                = local.common_tags
}

# Azure Cache for Redis
module "redis" {
  source = "../../modules/redis"

  project_name        = var.project_name
  environment         = var.environment
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  sku_name            = var.redis_sku
  family              = var.redis_family
  capacity            = var.redis_capacity
  subnet_id           = module.networking.redis_subnet_id
  tags                = local.common_tags
}

# Azure Key Vault
module "keyvault" {
  source = "../../modules/keyvault"

  project_name        = var.project_name
  environment         = var.environment
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  aks_principal_id    = module.aks.kubelet_identity_object_id
  tags                = local.common_tags
}

# Azure Service Bus
module "servicebus" {
  source = "../../modules/servicebus"

  project_name        = var.project_name
  environment         = var.environment
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = var.servicebus_sku
  tags                = local.common_tags
}

# Azure Blob Storage
module "storage" {
  source = "../../modules/storage"

  project_name        = var.project_name
  environment         = var.environment
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.common_tags
}

# Azure Monitor
module "monitoring" {
  source = "../../modules/monitoring"

  project_name        = var.project_name
  environment         = var.environment
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.common_tags
}

# Store secrets in Key Vault
resource "azurerm_key_vault_secret" "user_db_connection" {
  name         = "user-db-connection-string"
  value        = module.postgresql_user.connection_string
  key_vault_id = module.keyvault.key_vault_id
}

resource "azurerm_key_vault_secret" "product_db_connection" {
  name         = "product-db-connection-string"
  value        = module.postgresql_product.connection_string
  key_vault_id = module.keyvault.key_vault_id
}

resource "azurerm_key_vault_secret" "order_db_connection" {
  name         = "order-db-connection-string"
  value        = module.postgresql_order.connection_string
  key_vault_id = module.keyvault.key_vault_id
}

resource "azurerm_key_vault_secret" "redis_connection" {
  name         = "redis-connection-string"
  value        = module.redis.connection_string
  key_vault_id = module.keyvault.key_vault_id
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

resource "azurerm_key_vault_secret" "jwt_secret" {
  name         = "jwt-secret"
  value        = random_password.jwt_secret.result
  key_vault_id = module.keyvault.key_vault_id
}
```

---

### 7.3 Terraform Modules

#### File: `infrastructure/terraform/modules/aks/main.tf`
```hcl
resource "azurerm_kubernetes_cluster" "main" {
  name                = "${var.project_name}-${var.environment}-aks"
  location            = var.location
  resource_group_name = var.resource_group_name
  dns_prefix          = "${var.project_name}-${var.environment}"
  kubernetes_version  = var.kubernetes_version

  default_node_pool {
    name                = "default"
    node_count          = var.node_count
    vm_size             = var.node_vm_size
    vnet_subnet_id      = var.vnet_subnet_id
    os_disk_size_gb     = 50
    os_disk_type        = "Managed"
    max_pods            = 110
    enable_auto_scaling = true
    min_count           = var.node_count
    max_count           = var.node_count * 3

    upgrade_settings {
      max_surge = "33%"
    }
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin     = "azure"
    network_policy     = "azure"
    load_balancer_sku  = "standard"
    service_cidr       = "10.1.0.0/16"
    dns_service_ip     = "10.1.0.10"
  }

  oms_agent {
    log_analytics_workspace_id = var.log_analytics_workspace_id
  }

  azure_policy_enabled = true

  key_vault_secrets_provider {
    secret_rotation_enabled  = true
    secret_rotation_interval = "2m"
  }

  workload_identity_enabled = true
  oidc_issuer_enabled       = true

  tags = var.tags

  lifecycle {
    ignore_changes = [
      default_node_pool[0].node_count,
    ]
  }
}

# Grant AKS access to ACR
resource "azurerm_role_assignment" "aks_acr" {
  principal_id                     = azurerm_kubernetes_cluster.main.kubelet_identity[0].object_id
  role_definition_name             = "AcrPull"
  scope                            = var.acr_id
  skip_service_principal_aad_check = true
}
```

#### File: `infrastructure/terraform/modules/aks/outputs.tf`
```hcl
output "cluster_id" {
  value = azurerm_kubernetes_cluster.main.id
}

output "cluster_name" {
  value = azurerm_kubernetes_cluster.main.name
}

output "kube_config" {
  value     = azurerm_kubernetes_cluster.main.kube_config_raw
  sensitive = true
}

output "host" {
  value     = azurerm_kubernetes_cluster.main.kube_config[0].host
  sensitive = true
}

output "kubelet_identity_object_id" {
  value = azurerm_kubernetes_cluster.main.kubelet_identity[0].object_id
}

output "oidc_issuer_url" {
  value = azurerm_kubernetes_cluster.main.oidc_issuer_url
}
```

#### File: `infrastructure/terraform/modules/postgresql/main.tf`
```hcl
resource "random_password" "postgresql" {
  length  = 32
  special = false
}

resource "azurerm_postgresql_flexible_server" "main" {
  name                   = var.name
  resource_group_name    = var.resource_group_name
  location               = var.location
  version                = "15"
  delegated_subnet_id    = var.delegated_subnet_id
  private_dns_zone_id    = var.private_dns_zone_id
  administrator_login    = var.administrator_login
  administrator_password = random_password.postgresql.result
  zone                   = "1"

  storage_mb = var.storage_mb

  sku_name = var.sku_name

  backup_retention_days        = 7
  geo_redundant_backup_enabled = false

  high_availability {
    mode = var.environment == "production" ? "ZoneRedundant" : "Disabled"
  }

  tags = var.tags

  lifecycle {
    ignore_changes = [
      high_availability,
    ]
  }
}

resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = var.database_name
  server_id = azurerm_postgresql_flexible_server.main.id
  collation = "en_US.utf8"
  charset   = "utf8"
}

resource "azurerm_postgresql_flexible_server_configuration" "extensions" {
  name      = "azure.extensions"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "UUID-OSSP,PGCRYPTO"
}
```

#### File: `infrastructure/terraform/modules/postgresql/outputs.tf`
```hcl
output "server_id" {
  value = azurerm_postgresql_flexible_server.main.id
}

output "server_fqdn" {
  value = azurerm_postgresql_flexible_server.main.fqdn
}

output "connection_string" {
  value     = "postgresql://${var.administrator_login}:${random_password.postgresql.result}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${var.database_name}?sslmode=require"
  sensitive = true
}

output "administrator_password" {
  value     = random_password.postgresql.result
  sensitive = true
}
```

#### File: `infrastructure/terraform/modules/redis/main.tf`
```hcl
resource "azurerm_redis_cache" "main" {
  name                = "${var.project_name}-${var.environment}-redis"
  location            = var.location
  resource_group_name = var.resource_group_name
  capacity            = var.capacity
  family              = var.family
  sku_name            = var.sku_name

  enable_non_ssl_port = false
  minimum_tls_version = "1.2"

  redis_configuration {
    maxmemory_reserved = 50
    maxmemory_delta    = 50
    maxmemory_policy   = "volatile-lru"
  }

  # Private endpoint for production
  dynamic "subnet_id" {
    for_each = var.subnet_id != null ? [1] : []
    content {
      subnet_id = var.subnet_id
    }
  }

  tags = var.tags
}
```

#### File: `infrastructure/terraform/modules/keyvault/main.tf`
```hcl
data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "main" {
  name                        = "${var.project_name}${var.environment}kv"
  location                    = var.location
  resource_group_name         = var.resource_group_name
  enabled_for_disk_encryption = true
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  soft_delete_retention_days  = 7
  purge_protection_enabled    = false

  sku_name = "standard"

  enable_rbac_authorization = true

  network_acls {
    default_action = "Allow"
    bypass         = "AzureServices"
  }

  tags = var.tags
}

# Grant AKS access to Key Vault
resource "azurerm_role_assignment" "aks_keyvault" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = var.aks_principal_id
}

# Grant current user full access
resource "azurerm_role_assignment" "current_user" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Administrator"
  principal_id         = data.azurerm_client_config.current.object_id
}
```

#### File: `infrastructure/terraform/modules/monitoring/main.tf`
```hcl
resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.project_name}-${var.environment}-logs"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = var.tags
}

resource "azurerm_application_insights" "main" {
  name                = "${var.project_name}-${var.environment}-appinsights"
  location            = var.location
  resource_group_name = var.resource_group_name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"

  tags = var.tags
}

resource "azurerm_monitor_action_group" "main" {
  name                = "${var.project_name}-${var.environment}-alerts"
  resource_group_name = var.resource_group_name
  short_name          = "octoalerts"

  email_receiver {
    name          = "admin"
    email_address = var.alert_email
  }

  tags = var.tags
}
```

---

### 7.4 Variables

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

# Networking
variable "vnet_address_space" {
  description = "Address space for VNet"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

variable "aks_subnet_prefix" {
  description = "Address prefix for AKS subnet"
  type        = list(string)
  default     = ["10.0.1.0/24"]
}

variable "database_subnet_prefix" {
  description = "Address prefix for database subnet"
  type        = list(string)
  default     = ["10.0.2.0/24"]
}

variable "redis_subnet_prefix" {
  description = "Address prefix for Redis subnet"
  type        = list(string)
  default     = ["10.0.3.0/24"]
}

# AKS
variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "aks_node_count" {
  description = "Number of AKS nodes"
  type        = number
  default     = 2
}

variable "aks_node_vm_size" {
  description = "VM size for AKS nodes"
  type        = string
  default     = "Standard_D2s_v3"
}

# ACR
variable "acr_sku" {
  description = "ACR SKU"
  type        = string
  default     = "Basic"
}

# PostgreSQL
variable "postgresql_sku" {
  description = "PostgreSQL SKU"
  type        = string
  default     = "B_Standard_B1ms"
}

variable "postgresql_storage_mb" {
  description = "PostgreSQL storage in MB"
  type        = number
  default     = 32768
}

# Redis
variable "redis_sku" {
  description = "Redis SKU"
  type        = string
  default     = "Basic"
}

variable "redis_family" {
  description = "Redis family"
  type        = string
  default     = "C"
}

variable "redis_capacity" {
  description = "Redis capacity"
  type        = number
  default     = 0
}

# Service Bus
variable "servicebus_sku" {
  description = "Service Bus SKU"
  type        = string
  default     = "Basic"
}
```

#### File: `infrastructure/terraform/environments/dev/terraform.tfvars`
```hcl
project_name = "octoeshop"
environment  = "dev"
location     = "eastus"

# Networking
vnet_address_space     = ["10.0.0.0/16"]
aks_subnet_prefix      = ["10.0.1.0/24"]
database_subnet_prefix = ["10.0.2.0/24"]
redis_subnet_prefix    = ["10.0.3.0/24"]

# AKS - small for dev
kubernetes_version = "1.28"
aks_node_count     = 2
aks_node_vm_size   = "Standard_D2s_v3"

# ACR
acr_sku = "Basic"

# PostgreSQL - smallest for dev
postgresql_sku        = "B_Standard_B1ms"
postgresql_storage_mb = 32768

# Redis - smallest for dev
redis_sku      = "Basic"
redis_family   = "C"
redis_capacity = 0

# Service Bus
servicebus_sku = "Basic"
```

---

### 7.5 Outputs

#### File: `infrastructure/terraform/environments/dev/outputs.tf`
```hcl
output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "aks_cluster_name" {
  value = module.aks.cluster_name
}

output "aks_cluster_id" {
  value = module.aks.cluster_id
}

output "acr_login_server" {
  value = module.acr.login_server
}

output "acr_name" {
  value = module.acr.acr_name
}

output "key_vault_name" {
  value = module.keyvault.key_vault_name
}

output "key_vault_uri" {
  value = module.keyvault.key_vault_uri
}

output "log_analytics_workspace_id" {
  value = module.monitoring.log_analytics_workspace_id
}

output "application_insights_connection_string" {
  value     = module.monitoring.application_insights_connection_string
  sensitive = true
}

# Kubernetes configuration
output "kube_config_command" {
  value = "az aks get-credentials --resource-group ${azurerm_resource_group.main.name} --name ${module.aks.cluster_name}"
}
```

---

## Deployment Commands

```bash
# Initialize backend (one-time setup)
az group create --name octoeshop-tfstate-rg --location eastus
az storage account create --name octoeshoptfstate --resource-group octoeshop-tfstate-rg --sku Standard_LRS
az storage container create --name tfstate --account-name octoeshoptfstate

# Initialize Terraform
cd infrastructure/terraform/environments/dev
terraform init

# Plan changes
terraform plan -out=tfplan

# Apply changes
terraform apply tfplan

# Get AKS credentials
az aks get-credentials --resource-group octoeshop-dev-rg --name octoeshop-dev-aks

# Verify cluster access
kubectl get nodes
```

---

## Deliverables Checklist

- [ ] Terraform provider configuration
- [ ] Resource group creation
- [ ] Networking module (VNet, subnets, NSGs, private DNS)
- [ ] ACR module
- [ ] AKS module with autoscaling and monitoring
- [ ] PostgreSQL module (3 instances for User, Product, Order)
- [ ] Redis module
- [ ] Key Vault module with RBAC
- [ ] Service Bus module
- [ ] Storage module for blob storage
- [ ] Monitoring module (Log Analytics, App Insights)
- [ ] Secrets stored in Key Vault
- [ ] Dev environment configuration
- [ ] Staging environment configuration  
- [ ] Production environment configuration
- [ ] All resources pass `terraform plan` validation
- [ ] Infrastructure deployed successfully

---

## Dependencies

**Depends on:**
- Phase 1: Base Terraform modules

**Required by:**
- Phase 6: Kubernetes deployment (needs AKS)
- Phase 8: CI/CD pipeline (needs ACR, AKS)

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
  default     = "swedencentral"
}

variable "alert_email" {
  description = "Alert notification email"
  type        = string
  default     = ""
}

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

variable "enable_point_to_site_vpn" {
  description = "Enable dev Point-to-Site VPN for private Codespaces access"
  type        = bool
  default     = false
}

variable "gateway_subnet_prefix" {
  description = "Address prefix for the dev VPN GatewaySubnet"
  type        = list(string)
  default     = ["10.0.254.0/27"]
}

variable "p2s_dns_resolver_subnet_prefix" {
  description = "Address prefix for the dev Private DNS Resolver inbound endpoint subnet"
  type        = list(string)
  default     = ["10.0.253.0/28"]
}

variable "p2s_dns_resolver_inbound_private_ip" {
  description = "Static private IP for the dev Private DNS Resolver inbound endpoint"
  type        = string
  default     = "10.0.253.4"
}

variable "p2s_vpn_client_address_space" {
  description = "Address space assigned to dev Point-to-Site VPN clients"
  type        = list(string)
  default     = ["172.31.250.0/24"]
}

variable "p2s_vpn_gateway_sku" {
  description = "Dev Point-to-Site VPN gateway SKU"
  type        = string
  default     = "VpnGw1AZ"
}

variable "p2s_vpn_gateway_generation" {
  description = "Dev Point-to-Site VPN gateway generation"
  type        = string
  default     = "Generation1"
}

variable "p2s_vpn_root_certificate_name" {
  description = "Name assigned to the trusted dev Point-to-Site VPN root certificate"
  type        = string
  default     = "codespaces-dev-root"
}

variable "p2s_vpn_root_certificate_public_data" {
  description = "Base64 public root certificate data for dev Point-to-Site VPN clients"
  type        = string
  default     = ""
}

variable "enable_github_hosted_runner_networking" {
  description = "Enable Azure-side GitHub-hosted runner private networking resources for dev"
  type        = bool
  default     = false
}

variable "github_hosted_runner_subnet_prefix" {
  description = "Address prefix for the dev GitHub-hosted runner private networking subnet"
  type        = list(string)
  default     = ["10.0.252.0/24"]
}

variable "github_hosted_runner_business_id" {
  description = "GitHub organization or enterprise databaseId for GitHub.Network/networkSettings"
  type        = string
  default     = ""
}

variable "github_hosted_runner_network_settings_name" {
  description = "Name for the dev GitHub.Network/networkSettings Azure resource"
  type        = string
  default     = null
}

variable "kubernetes_version" {
  description = "Kubernetes version for AKS"
  type        = string
  default     = null
  nullable    = true
}

variable "aks_node_count" {
  description = "Number of AKS nodes"
  type        = number
  default     = 1
}

variable "aks_node_vm_size" {
  description = "VM size for AKS nodes"
  type        = string
  default     = "Standard_D2s_v3"
}

variable "acr_sku" {
  description = "ACR SKU"
  type        = string
  default     = "Basic"
}

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

variable "servicebus_sku" {
  description = "Service Bus SKU"
  type        = string
  default     = "Basic"
}

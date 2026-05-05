variable "project_name" {
  description = "Project short name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
}

variable "resource_group_id" {
  description = "Resource group ID"
  type        = string
}

variable "vnet_address_space" {
  description = "Virtual network address spaces"
  type        = list(string)
}

variable "aks_subnet_prefix" {
  description = "AKS subnet CIDR"
  type        = list(string)
}

variable "database_subnet_prefix" {
  description = "Database subnet CIDR"
  type        = list(string)
}

variable "redis_subnet_prefix" {
  description = "Redis subnet CIDR"
  type        = list(string)
}

variable "enable_point_to_site_vpn" {
  description = "Whether to create Point-to-Site VPN infrastructure for private developer access"
  type        = bool
  default     = false
}

variable "gateway_subnet_prefix" {
  description = "GatewaySubnet CIDR for the Point-to-Site VPN gateway"
  type        = list(string)
  default     = []
}

variable "p2s_vpn_client_address_space" {
  description = "Address space assigned to Point-to-Site VPN clients"
  type        = list(string)
  default     = []
}

variable "p2s_vpn_gateway_sku" {
  description = "Azure VPN gateway SKU for Point-to-Site access"
  type        = string
  default     = "VpnGw1AZ"
}

variable "p2s_vpn_gateway_generation" {
  description = "Azure VPN gateway generation"
  type        = string
  default     = "Generation1"
}

variable "p2s_vpn_root_certificate_name" {
  description = "Name assigned to the trusted Point-to-Site VPN root certificate"
  type        = string
  default     = "codespaces-dev-root"
}

variable "p2s_vpn_root_certificate_public_data" {
  description = "Base64 public root certificate data trusted by the Point-to-Site VPN gateway"
  type        = string
  default     = ""
}

variable "p2s_dns_resolver_subnet_prefix" {
  description = "Dedicated subnet CIDR for the Private DNS Resolver inbound endpoint"
  type        = list(string)
  default     = []
}

variable "p2s_dns_resolver_inbound_private_ip" {
  description = "Static private IP address for the Private DNS Resolver inbound endpoint"
  type        = string
  default     = null
}

variable "enable_github_hosted_runner_networking" {
  description = "Whether to create Azure-side GitHub-hosted runner private networking resources"
  type        = bool
  default     = false
}

variable "github_hosted_runner_subnet_prefix" {
  description = "Dedicated subnet CIDR for GitHub-hosted runner private networking"
  type        = list(string)
  default     = []
}

variable "github_hosted_runner_business_id" {
  description = "GitHub organization or enterprise databaseId used by GitHub.Network/networkSettings"
  type        = string
  default     = ""
}

variable "github_hosted_runner_network_settings_name" {
  description = "Name for the GitHub.Network/networkSettings Azure resource"
  type        = string
  default     = null
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}

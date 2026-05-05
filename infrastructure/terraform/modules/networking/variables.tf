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

variable "enable_hosted_compute_private_networking" {
  description = "Whether to create Azure-side GitHub hosted-compute private networking resources (used by Codespaces VNet integration and/or GitHub-hosted Actions runners via a GitHub org-level network configuration)"
  type        = bool
  default     = false
}

variable "hosted_compute_subnet_prefix" {
  description = "Dedicated subnet CIDR delegated to GitHub.Network/networkSettings (must be at least /24)"
  type        = list(string)
  default     = []
}

variable "hosted_compute_business_id" {
  description = "GitHub organization or enterprise databaseId used by GitHub.Network/networkSettings"
  type        = string
  default     = ""
}

variable "hosted_compute_network_settings_name" {
  description = "Name for the GitHub.Network/networkSettings Azure resource"
  type        = string
  default     = null
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}

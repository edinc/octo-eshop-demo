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

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}

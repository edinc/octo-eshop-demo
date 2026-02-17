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

variable "kubernetes_version" {
  description = "AKS Kubernetes version"
  type        = string
  default     = null
  nullable    = true
}

variable "node_count" {
  description = "Node pool base node count"
  type        = number
}

variable "node_vm_size" {
  description = "Node VM size"
  type        = string
}

variable "vnet_subnet_id" {
  description = "AKS subnet ID"
  type        = string
}

variable "acr_id" {
  description = "ACR resource ID"
  type        = string
}

variable "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID"
  type        = string
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}

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

variable "sku_name" {
  description = "Redis SKU"
  type        = string
}

variable "family" {
  description = "Redis family"
  type        = string
}

variable "capacity" {
  description = "Redis capacity"
  type        = number
}

variable "subnet_id" {
  description = "Redis subnet ID for Premium SKU"
  type        = string
  default     = null
  nullable    = true
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}

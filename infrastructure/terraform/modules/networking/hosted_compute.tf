locals {
  hosted_compute_networking_enabled       = var.enable_hosted_compute_private_networking
  hosted_compute_network_settings_name    = var.hosted_compute_network_settings_name != null && trimspace(var.hosted_compute_network_settings_name) != "" ? trimspace(var.hosted_compute_network_settings_name) : "${var.project_name}-${var.environment}-hosted-compute-network"
  hosted_compute_business_id              = trimspace(var.hosted_compute_business_id)
  hosted_compute_subnet_prefix_configured = length(var.hosted_compute_subnet_prefix) > 0
}

resource "azurerm_network_security_group" "hosted_compute" {
  count = local.hosted_compute_networking_enabled ? 1 : 0

  name                = "${var.project_name}-${var.environment}-hosted-compute-nsg"
  location            = var.location
  resource_group_name = var.resource_group_name
  tags                = var.tags

  security_rule {
    name                       = "DenyAllInbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

resource "azurerm_subnet" "hosted_compute" {
  count = local.hosted_compute_networking_enabled ? 1 : 0

  name                 = "${var.project_name}-${var.environment}-hosted-compute-subnet"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = var.hosted_compute_subnet_prefix

  default_outbound_access_enabled = true

  delegation {
    name = "github-network-settings"

    service_delegation {
      name    = "GitHub.Network/networkSettings"
      actions = ["Microsoft.Network/virtualNetworks/subnets/action"]
    }
  }

  lifecycle {
    precondition {
      condition     = local.hosted_compute_subnet_prefix_configured
      error_message = "hosted_compute_subnet_prefix must be set when GitHub hosted-compute private networking is enabled."
    }
  }
}

resource "azurerm_subnet_network_security_group_association" "hosted_compute" {
  count = local.hosted_compute_networking_enabled ? 1 : 0

  subnet_id                 = azurerm_subnet.hosted_compute[0].id
  network_security_group_id = azurerm_network_security_group.hosted_compute[0].id
}

resource "azapi_resource" "hosted_compute_network_settings" {
  count = local.hosted_compute_networking_enabled ? 1 : 0

  type      = "GitHub.Network/networkSettings@2024-04-02"
  name      = local.hosted_compute_network_settings_name
  parent_id = var.resource_group_id
  location  = var.location
  tags      = var.tags

  body = {
    properties = {
      businessId = local.hosted_compute_business_id
      subnetId   = azurerm_subnet.hosted_compute[0].id
    }
  }

  lifecycle {
    precondition {
      condition     = length(local.hosted_compute_business_id) > 0
      error_message = "hosted_compute_business_id must be set to a GitHub organization or enterprise databaseId when hosted-compute private networking is enabled."
    }
  }
}

moved {
  from = azurerm_network_security_group.github_hosted_runner
  to   = azurerm_network_security_group.hosted_compute
}

moved {
  from = azurerm_subnet.github_hosted_runner
  to   = azurerm_subnet.hosted_compute
}

moved {
  from = azurerm_subnet_network_security_group_association.github_hosted_runner
  to   = azurerm_subnet_network_security_group_association.hosted_compute
}

moved {
  from = azapi_resource.github_hosted_runner_network_settings
  to   = azapi_resource.hosted_compute_network_settings
}

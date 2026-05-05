locals {
  github_hosted_runner_networking_enabled       = var.enable_github_hosted_runner_networking
  github_hosted_runner_network_settings_name    = var.github_hosted_runner_network_settings_name != null && trimspace(var.github_hosted_runner_network_settings_name) != "" ? trimspace(var.github_hosted_runner_network_settings_name) : "${var.project_name}-${var.environment}-github-runner-network"
  github_hosted_runner_business_id              = trimspace(var.github_hosted_runner_business_id)
  github_hosted_runner_subnet_prefix_configured = length(var.github_hosted_runner_subnet_prefix) > 0
}

resource "azurerm_network_security_group" "github_hosted_runner" {
  count = local.github_hosted_runner_networking_enabled ? 1 : 0

  name                = "${var.project_name}-${var.environment}-github-hosted-runner-nsg"
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

resource "azurerm_subnet" "github_hosted_runner" {
  count = local.github_hosted_runner_networking_enabled ? 1 : 0

  name                 = "${var.project_name}-${var.environment}-github-hosted-runner-subnet"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = var.github_hosted_runner_subnet_prefix

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
      condition     = local.github_hosted_runner_subnet_prefix_configured
      error_message = "github_hosted_runner_subnet_prefix must be set when GitHub-hosted runner networking is enabled."
    }
  }
}

resource "azurerm_subnet_network_security_group_association" "github_hosted_runner" {
  count = local.github_hosted_runner_networking_enabled ? 1 : 0

  subnet_id                 = azurerm_subnet.github_hosted_runner[0].id
  network_security_group_id = azurerm_network_security_group.github_hosted_runner[0].id
}

resource "azapi_resource" "github_hosted_runner_network_settings" {
  count = local.github_hosted_runner_networking_enabled ? 1 : 0

  type      = "GitHub.Network/networkSettings@2024-04-02"
  name      = local.github_hosted_runner_network_settings_name
  parent_id = var.resource_group_id
  location  = var.location
  tags      = var.tags

  body = {
    properties = {
      businessId = local.github_hosted_runner_business_id
      subnetId   = azurerm_subnet.github_hosted_runner[0].id
    }
  }

  lifecycle {
    precondition {
      condition     = length(local.github_hosted_runner_business_id) > 0
      error_message = "github_hosted_runner_business_id must be set to a GitHub organization or enterprise databaseId when GitHub-hosted runner networking is enabled."
    }
  }
}

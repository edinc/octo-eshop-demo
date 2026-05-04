locals {
  p2s_vpn_enabled = var.enable_point_to_site_vpn
  p2s_vpn_root_certificate_public_data = replace(
    replace(
      replace(
        replace(trimspace(var.p2s_vpn_root_certificate_public_data), "-----BEGIN CERTIFICATE-----", ""),
        "-----END CERTIFICATE-----",
        ""
      ),
      "\r",
      ""
    ),
    "\n",
    ""
  )
}

resource "azurerm_subnet" "gateway" {
  count = local.p2s_vpn_enabled ? 1 : 0

  name                 = "GatewaySubnet"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = var.gateway_subnet_prefix

  default_outbound_access_enabled = false
}

resource "azurerm_subnet" "dns_resolver_inbound" {
  count = local.p2s_vpn_enabled ? 1 : 0

  name                 = "${var.project_name}-${var.environment}-dns-inbound-subnet"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = var.p2s_dns_resolver_subnet_prefix

  default_outbound_access_enabled = false

  delegation {
    name = "dns-resolver"

    service_delegation {
      name    = "Microsoft.Network/dnsResolvers"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}

resource "azurerm_public_ip" "vpn_gateway" {
  count = local.p2s_vpn_enabled ? 1 : 0

  name                = "${var.project_name}-${var.environment}-p2s-vpn-pip"
  location            = var.location
  resource_group_name = var.resource_group_name
  allocation_method   = "Static"
  sku                 = "Standard"
  zones               = ["1", "2", "3"]
  tags                = var.tags
}

resource "azurerm_private_dns_resolver" "p2s" {
  count = local.p2s_vpn_enabled ? 1 : 0

  name                = "${var.project_name}-${var.environment}-p2s-dns-resolver"
  resource_group_name = var.resource_group_name
  location            = var.location
  virtual_network_id  = azurerm_virtual_network.main.id
  tags                = var.tags
}

resource "azurerm_private_dns_resolver_inbound_endpoint" "p2s" {
  count = local.p2s_vpn_enabled ? 1 : 0

  name                    = "${var.project_name}-${var.environment}-p2s-dns-inbound"
  private_dns_resolver_id = azurerm_private_dns_resolver.p2s[0].id
  location                = var.location
  tags                    = var.tags

  ip_configurations {
    private_ip_allocation_method = "Static"
    private_ip_address           = var.p2s_dns_resolver_inbound_private_ip
    subnet_id                    = azurerm_subnet.dns_resolver_inbound[0].id
  }
}

resource "azurerm_virtual_network_gateway" "p2s" {
  count = local.p2s_vpn_enabled ? 1 : 0

  name                = "${var.project_name}-${var.environment}-p2s-vng"
  location            = var.location
  resource_group_name = var.resource_group_name

  type       = "Vpn"
  vpn_type   = "RouteBased"
  sku        = var.p2s_vpn_gateway_sku
  generation = var.p2s_vpn_gateway_generation

  active_active = false
  bgp_enabled   = false

  ip_configuration {
    name                          = "gateway-ipconfig"
    public_ip_address_id          = azurerm_public_ip.vpn_gateway[0].id
    private_ip_address_allocation = "Dynamic"
    subnet_id                     = azurerm_subnet.gateway[0].id
  }

  vpn_client_configuration {
    address_space        = var.p2s_vpn_client_address_space
    vpn_auth_types       = ["Certificate"]
    vpn_client_protocols = ["OpenVPN"]

    root_certificate {
      name             = var.p2s_vpn_root_certificate_name
      public_cert_data = local.p2s_vpn_root_certificate_public_data
    }
  }

  tags = var.tags

  lifecycle {
    precondition {
      condition     = length(var.gateway_subnet_prefix) > 0
      error_message = "gateway_subnet_prefix must be set when Point-to-Site VPN is enabled."
    }

    precondition {
      condition     = length(var.p2s_vpn_client_address_space) > 0
      error_message = "p2s_vpn_client_address_space must be set when Point-to-Site VPN is enabled."
    }

    precondition {
      condition     = length(var.p2s_dns_resolver_subnet_prefix) > 0
      error_message = "p2s_dns_resolver_subnet_prefix must be set when Point-to-Site VPN is enabled."
    }

    precondition {
      condition     = var.p2s_dns_resolver_inbound_private_ip != null && length(trimspace(var.p2s_dns_resolver_inbound_private_ip)) > 0
      error_message = "p2s_dns_resolver_inbound_private_ip must be set when Point-to-Site VPN is enabled."
    }

    precondition {
      condition     = length(local.p2s_vpn_root_certificate_public_data) > 0
      error_message = "p2s_vpn_root_certificate_public_data must be set to the base64 public root certificate before planning or applying Point-to-Site VPN."
    }
  }
}

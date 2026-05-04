output "vnet_id" {
  value = azurerm_virtual_network.main.id
}

output "aks_subnet_id" {
  value = azurerm_subnet.aks.id
}

output "database_subnet_id" {
  value = azurerm_subnet.database.id
}

output "redis_subnet_id" {
  value = azurerm_subnet.redis.id
}

output "postgresql_private_dns_zone_id" {
  value = azurerm_private_dns_zone.postgresql.id
}

output "p2s_vpn_gateway_name" {
  value = var.enable_point_to_site_vpn ? azurerm_virtual_network_gateway.p2s[0].name : null
}

output "p2s_vpn_client_address_space" {
  value = var.enable_point_to_site_vpn ? var.p2s_vpn_client_address_space : []
}

output "p2s_dns_resolver_inbound_ip" {
  value = var.enable_point_to_site_vpn ? azurerm_private_dns_resolver_inbound_endpoint.p2s[0].ip_configurations[0].private_ip_address : null
}

output "p2s_vpn_dns_servers" {
  value = var.enable_point_to_site_vpn ? [azurerm_private_dns_resolver_inbound_endpoint.p2s[0].ip_configurations[0].private_ip_address] : []
}

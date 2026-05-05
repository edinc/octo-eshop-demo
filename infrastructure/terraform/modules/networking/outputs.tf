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

output "hosted_compute_subnet_id" {
  value = var.enable_hosted_compute_private_networking ? azurerm_subnet.hosted_compute[0].id : null
}

output "hosted_compute_network_settings_id" {
  value = var.enable_hosted_compute_private_networking ? azapi_resource.hosted_compute_network_settings[0].id : null
}

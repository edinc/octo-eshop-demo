output "redis_id" {
  value = azurerm_redis_cache.main.id
}

output "redis_name" {
  value = azurerm_redis_cache.main.name
}

output "hostname" {
  value = azurerm_redis_cache.main.hostname
}

output "ssl_port" {
  value = azurerm_redis_cache.main.ssl_port
}

output "connection_string" {
  value     = "${azurerm_redis_cache.main.hostname}:${azurerm_redis_cache.main.ssl_port},password=${azurerm_redis_cache.main.primary_access_key},ssl=True,abortConnect=False"
  sensitive = true
}

output "namespace_id" {
  value = azurerm_servicebus_namespace.main.id
}

output "namespace_name" {
  value = azurerm_servicebus_namespace.main.name
}

output "primary_connection_string" {
  value     = azurerm_servicebus_namespace_authorization_rule.apps.primary_connection_string
  sensitive = true
}

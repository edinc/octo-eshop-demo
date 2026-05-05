output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "aks_cluster_name" {
  value = module.aks.cluster_name
}

output "aks_cluster_id" {
  value = module.aks.cluster_id
}

output "acr_login_server" {
  value = module.acr.login_server
}

output "acr_name" {
  value = module.acr.acr_name
}

output "key_vault_name" {
  value = module.keyvault.key_vault_name
}

output "key_vault_uri" {
  value = module.keyvault.key_vault_uri
}

output "log_analytics_workspace_id" {
  value = module.monitoring.log_analytics_workspace_id
}

output "application_insights_connection_string" {
  value     = module.monitoring.application_insights_connection_string
  sensitive = true
}

output "kube_config_command" {
  value = "az aks get-credentials --resource-group ${azurerm_resource_group.main.name} --name ${module.aks.cluster_name}"
}

output "p2s_vpn_gateway_name" {
  value = module.networking.p2s_vpn_gateway_name
}

output "p2s_vpn_client_address_space" {
  value = module.networking.p2s_vpn_client_address_space
}

output "p2s_dns_resolver_inbound_ip" {
  value = module.networking.p2s_dns_resolver_inbound_ip
}

output "p2s_vpn_dns_servers" {
  value = module.networking.p2s_vpn_dns_servers
}

output "github_hosted_runner_subnet_id" {
  value = module.networking.github_hosted_runner_subnet_id
}

output "github_hosted_runner_network_settings_id" {
  value = module.networking.github_hosted_runner_network_settings_id
}

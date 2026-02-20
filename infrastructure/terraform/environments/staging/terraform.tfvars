project_name = "octoeshop"
environment  = "staging"
location     = "swedencentral"
alert_email  = ""

vnet_address_space     = ["10.10.0.0/16"]
aks_subnet_prefix      = ["10.10.1.0/24"]
database_subnet_prefix = ["10.10.2.0/24"]
redis_subnet_prefix    = ["10.10.3.0/24"]

kubernetes_version = null
aks_node_count     = 2
aks_node_vm_size   = "Standard_D2s_v3"

acr_sku = "Standard"

postgresql_sku        = "GP_Standard_D2s_v3"
postgresql_storage_mb = 65536

redis_sku      = "Basic"
redis_family   = "C"
redis_capacity = 0

servicebus_sku = "Standard"

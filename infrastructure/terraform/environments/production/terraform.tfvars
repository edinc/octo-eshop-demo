project_name = "octoeshop"
environment  = "production"
location     = "swedencentral"
alert_email  = ""

vnet_address_space     = ["10.20.0.0/16"]
aks_subnet_prefix      = ["10.20.1.0/24"]
database_subnet_prefix = ["10.20.2.0/24"]
redis_subnet_prefix    = ["10.20.3.0/24"]

kubernetes_version = null
aks_node_count     = 3
aks_node_vm_size   = "Standard_D4s_v3"

acr_sku = "Premium"

postgresql_sku        = "GP_Standard_D4s_v3"
postgresql_storage_mb = 131072

redis_sku      = "Premium"
redis_family   = "P"
redis_capacity = 1

servicebus_sku = "Standard"
